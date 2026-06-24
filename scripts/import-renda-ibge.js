/**
 * import-renda-ibge.js
 * Importa renda média real por bairro cruzando:
 * - MG_Renda_Preliminar.csv (IBGE Censo 2022 por setor censitário)
 * - public/uberlandia-bairros.json (GeoJSON dos bairros)
 *
 * Estratégia de cruzamento:
 * 1. Filtra setores de Uberlândia (cod_mun = 3170206)
 * 2. Para cada setor, usa o centroide calculado pelo código do setor
 * 3. Faz point-in-polygon com o GeoJSON dos bairros
 * 4. Agrega renda média ponderada por domicílios
 *
 * Uso: node scripts/import-renda-ibge.js
 *
 * Arquivos necessários na raiz:
 *   MG_Renda_Preliminar.csv  (IBGE FTP: /Censo_2022/Agregados_por_Setores_Censitarios/)
 *   MG_Domicilio01_Preliminar.csv (para número de domicílios — peso da média)
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const prisma = new PrismaClient()

// ── Point-in-polygon (Ray casting) ────────────────────────────────────────────
function pointInPolygon(point, polygon) {
  const [px, py] = point
  let inside = false
  const coords = polygon[0] // exterior ring
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i]
    const [xj, yj] = coords[j]
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

function featureContainsPoint(feature, point) {
  const geom = feature.geometry
  if (!geom) return false
  if (geom.type === 'Polygon') return pointInPolygon(point, geom.coordinates)
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.some(poly => pointInPolygon(point, poly))
  }
  return false
}

// ── Centroide aproximado de um setor a partir do código ───────────────────────
// O IBGE codifica setor como: cod_uf(2) + cod_mun(5) + cod_distrito(2) + cod_subdistrito(2) + cod_setor(4)
// Os CSVs de renda têm lat/lon ou podemos usar o shapefile
// Fallback: usamos as colunas de lat/lon quando disponíveis no CSV
function parseCentroid(row) {
  // Tenta lat/lon direto
  const lat = parseFloat(row.latitude || row.LAT || row.lat || '')
  const lon = parseFloat(row.longitude || row.LON || row.lon || row.lng || '')
  if (!isNaN(lat) && !isNaN(lon)) return [lon, lat]
  return null
}

// ── Normalizar nome ────────────────────────────────────────────────────────────
function normalizeStr(s) {
  return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : ''
}

// ── Colunas de renda no CSV do IBGE ───────────────────────────────────────────
// V001 = Valor do rendimento nominal médio mensal das pessoas responsáveis
// V002 = Valor do rendimento nominal médio mensal dos domicílios particulares permanentes
// V003 = Valor do rendimento nominal médio mensal per capita dos domicílios
function extractRenda(row) {
  // Tenta diferentes nomes de coluna que o IBGE usa
  const candidates = [
    row.V003, row.v003,           // per capita (melhor indicador)
    row.V002, row.v002,           // renda domiciliar
    row.V001, row.v001,           // renda responsável
    row.renda_media, row.RENDA,
  ]
  for (const v of candidates) {
    const n = parseFloat(String(v || '').replace(',', '.'))
    if (!isNaN(n) && n > 0 && n < 100000) return n
  }
  return null
}

function extractDomicilios(row) {
  const candidates = [row.V001, row.v001, row.domicilios, row.DOMICILIOS]
  for (const v of candidates) {
    const n = parseInt(String(v || '').replace(',', '.'))
    if (!isNaN(n) && n > 0) return n
  }
  return 1 // peso mínimo
}

async function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' }))
      .on('data', r => rows.push(r))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

async function main() {
  // Verificar arquivos necessários
  const rendaFile = fs.existsSync('MG_Renda_Preliminar.csv')
    ? 'MG_Renda_Preliminar.csv'
    : fs.existsSync('MG_Renda_preliminar.csv')
      ? 'MG_Renda_preliminar.csv'
      : null

  if (!rendaFile) {
    console.error('❌ Arquivo MG_Renda_Preliminar.csv não encontrado.')
    console.error('')
    console.error('📥 Como baixar:')
    console.error('   1. Acesse: https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/')
    console.error('   2. Baixe: MG_Renda_Preliminar_20231030.zip')
    console.error('   3. Extraia e coloque MG_Renda_Preliminar.csv na raiz do projeto')
    process.exit(1)
  }

  console.log(`📊 Carregando ${rendaFile}...`)
  const allRows = await loadCSV(rendaFile)
  console.log(`   ${allRows.length.toLocaleString('pt-BR')} setores em MG`)

  // Filtrar Uberlândia (código IBGE: 3170206)
  const udiRows = allRows.filter(r => {
    const cod = (r.Cod_setor || r.cod_setor || r.COD_SETOR || '').toString()
    return cod.startsWith('3170206') || cod.startsWith('317020600')
  })
  console.log(`   ${udiRows.length} setores em Uberlândia\n`)

  if (udiRows.length === 0) {
    // Tentar com separador vírgula
    console.error('⚠️  Nenhum setor de Uberlândia encontrado. Verifique se o CSV usa ; como separador.')
    console.error('   Primeiras colunas:', Object.keys(allRows[0] || {}).join(', '))
    process.exit(1)
  }

  // Mostrar colunas disponíveis
  console.log('📋 Colunas disponíveis:', Object.keys(udiRows[0]).join(', '))
  console.log()

  // Carregar GeoJSON dos bairros
  const geoData = JSON.parse(fs.readFileSync('public/uberlandia-bairros.json', 'utf-8'))
  const features = geoData.features

  // Para cada setor, descobrir qual bairro ele pertence
  const bairroRenda = {} // bairroNome -> { soma_renda_ponderada, total_domicilios }

  let matched = 0, unmatched = 0, semRenda = 0

  for (const row of udiRows) {
    const centroid = parseCentroid(row)
    if (!centroid) { unmatched++; continue }

    const renda = extractRenda(row)
    if (!renda) { semRenda++; continue }

    const domicilios = extractDomicilios(row)

    // Point-in-polygon: achar o bairro
    let bairroEncontrado = null
    for (const feature of features) {
      if (featureContainsPoint(feature, centroid)) {
        bairroEncontrado = feature.properties.nome
        break
      }
    }

    if (!bairroEncontrado) { unmatched++; continue }

    if (!bairroRenda[bairroEncontrado]) {
      bairroRenda[bairroEncontrado] = { soma: 0, domicilios: 0 }
    }
    bairroRenda[bairroEncontrado].soma += renda * domicilios
    bairroRenda[bairroEncontrado].domicilios += domicilios
    matched++
  }

  console.log(`✅ ${matched} setores cruzados com bairros`)
  console.log(`⚠️  ${unmatched} sem coordenada ou fora do GeoJSON`)
  console.log(`⚠️  ${semRenda} sem dado de renda`)
  console.log()

  // Calcular média ponderada e salvar no banco
  const city = await prisma.city.findFirst({
    where: { name: { contains: 'Uberlândia', mode: 'insensitive' } }
  })
  if (!city) { console.error('❌ Cidade não encontrada no banco.'); process.exit(1) }

  let savedCount = 0
  console.log('💾 Salvando no banco...\n')

  for (const [bairroNome, dados] of Object.entries(bairroRenda)) {
    const rendaMedia = Math.round(dados.soma / dados.domicilios)

    const neighborhood = await prisma.neighborhood.findFirst({
      where: {
        name: { equals: bairroNome, mode: 'insensitive' },
        cityId: city.id
      }
    })

    if (!neighborhood) {
      console.log(`  ⚠️  Bairro não encontrado no banco: ${bairroNome}`)
      continue
    }

    await prisma.neighborhood.update({
      where: { id: neighborhood.id },
      data: { averageIncome: rendaMedia }
    })

    console.log(`  ✅ ${bairroNome.padEnd(30)} → R$ ${rendaMedia.toLocaleString('pt-BR')}/mês (${dados.domicilios} domicílios)`)
    savedCount++
  }

  console.log(`\n🎉 ${savedCount} bairros atualizados com renda real do IBGE Censo 2022`)

  // Bairros sem dado
  const neighborhoods = await prisma.neighborhood.findMany({
    where: { cityId: city.id, averageIncome: null }
  })
  if (neighborhoods.length > 0) {
    console.log(`\n⚠️  ${neighborhoods.length} bairros ainda sem renda (sem setores correspondentes):`)
    neighborhoods.forEach(n => console.log(`   - ${n.name}`))
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
