/**
 * Script de importação de ocorrências criminais — SSP-MG
 *
 * COMO USAR:
 * 1. Acesse: https://dados.mg.gov.br/dataset/estatisticas-de-seguranca-publica
 * 2. Baixe o arquivo CSV mais recente (ex: "ocorrencias-criminais-2024.csv")
 * 3. Salve na raiz do projeto como "crimes-ssp-mg.csv"
 * 4. Execute: node scripts/import-crimes.js
 *
 * O arquivo CSV da SSP-MG tem as colunas:
 * municipio, bairro, natureza, ano, mes, ocorrencias
 *
 * ATUALIZAÇÃO MENSAL:
 * Baixe o CSV novo, substitua o arquivo e rode o script novamente.
 * O upsert garante que dados existentes não sejam duplicados.
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const prisma = new PrismaClient()

// Mapeamento dos tipos de crime da SSP-MG para categorias do sistema
const CRIME_TYPE_MAP = {
  // Roubos
  'roubo consumado': 'ROUBO',
  'roubo a transeunte': 'ROUBO',
  'roubo de veículo': 'ROUBO',
  'roubo a estabelecimento comercial': 'ROUBO',
  'roubo de celular': 'ROUBO',
  // Furtos
  'furto consumado': 'FURTO',
  'furto de veículo': 'FURTO',
  'furto a estabelecimento comercial': 'FURTO',
  // Homicídios
  'homicídio doloso consumado': 'HOMICIDIO',
  'homicídio culposo': 'HOMICIDIO',
  'tentativa de homicídio': 'HOMICIDIO',
  // Tráfico
  'tráfico de entorpecentes': 'TRAFICO',
  'porte de drogas': 'TRAFICO',
  // Lesão
  'lesão corporal dolosa': 'LESAO',
  'lesão corporal culposa': 'LESAO',
  'violência doméstica': 'LESAO',
  // Estupro
  'estupro consumado': 'ESTUPRO',
  'estupro de vulnerável': 'ESTUPRO',
}

function mapCrimeType(natureza) {
  const normalized = natureza.toLowerCase().trim()
  return CRIME_TYPE_MAP[normalized] || 'OUTROS'
}

function normalizeStr(str) {
  return str
    ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    : ''
}

async function main() {
  const csvFile = path.join(process.cwd(), 'crimes-ssp-mg.csv')

  if (!fs.existsSync(csvFile)) {
    console.error('❌ Arquivo crimes-ssp-mg.csv não encontrado na raiz do projeto.')
    console.error('')
    console.error('📥 Como baixar:')
    console.error('   1. Acesse: https://dados.mg.gov.br/dataset/estatisticas-de-seguranca-publica')
    console.error('   2. Baixe o CSV mais recente de Uberlândia')
    console.error('   3. Salve como crimes-ssp-mg.csv na raiz do projeto')
    process.exit(1)
  }

  console.log('🚨 Iniciando importação de ocorrências SSP-MG...')

  // Carregar bairros e cidade do banco
  const city = await prisma.city.findFirst({ where: { name: { contains: 'Uberlândia', mode: 'insensitive' } } })
  if (!city) { console.error('❌ Cidade Uberlândia não encontrada no banco. Rode o seed primeiro.'); process.exit(1) }

  const neighborhoods = await prisma.neighborhood.findMany({ where: { cityId: city.id } })
  const neighborhoodMap = new Map(neighborhoods.map(n => [normalizeStr(n.name), n.id]))

  console.log(`📍 ${neighborhoods.length} bairros carregados do banco`)

  const rows = []
  let skippedCity = 0

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv({ separator: ';' })) // SSP-MG usa ponto-e-vírgula
      .on('data', row => rows.push(row))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`📄 ${rows.length} linhas lidas do CSV`)

  // Filtrar apenas Uberlândia
  const uberlandiaRows = rows.filter(row => {
    const municipio = normalizeStr(row.municipio || row.MUNICIPIO || row['Município'] || '')
    const isUdi = municipio.includes('uberlandia') || municipio.includes('uberlândia')
    if (!isUdi) skippedCity++
    return isUdi
  })

  console.log(`🏙️  ${uberlandiaRows.length} ocorrências de Uberlândia encontradas`)

  let imported = 0
  let skippedNeighborhood = 0
  let errors = 0
  const unmatchedBairros = new Set()

  for (const row of uberlandiaRows) {
    try {
      // Normalizar colunas (SSP-MG pode variar o nome das colunas entre anos)
      const bairro = row.bairro || row.BAIRRO || row['Bairro'] || ''
      const natureza = row.natureza || row.NATUREZA || row['Natureza'] || ''
      const ano = parseInt(row.ano || row.ANO || row['Ano'] || '0')
      const mes = parseInt(row.mes || row.MES || row['Mês'] || row['Mes'] || '0')
      const ocorrencias = parseInt(row.ocorrencias || row.OCORRENCIAS || row['Ocorrências'] || row['Quantidade'] || '0')

      if (!bairro || !natureza || !ano || !mes || isNaN(ocorrencias)) continue

      // Buscar bairro no banco
      const bairroNorm = normalizeStr(bairro)
      let neighborhoodId = neighborhoodMap.get(bairroNorm)

      // Tentar match parcial se não encontrou exato
      if (!neighborhoodId) {
        for (const [key, id] of neighborhoodMap) {
          if (key.includes(bairroNorm) || bairroNorm.includes(key)) {
            neighborhoodId = id
            break
          }
        }
      }

      if (!neighborhoodId) {
        unmatchedBairros.add(bairro)
        skippedNeighborhood++
        continue
      }

      const crimeType = mapCrimeType(natureza)

      await prisma.crimeOccurrence.upsert({
        where: {
          neighborhoodId_year_month_crimeType: {
            neighborhoodId,
            year: ano,
            month: mes,
            crimeType,
          }
        },
        update: { count: { increment: ocorrencias } },
        create: {
          neighborhoodId,
          cityId: city.id,
          year: ano,
          month: mes,
          crimeType,
          count: ocorrencias,
          source: 'SSP-MG',
        }
      })

      imported++
    } catch (err) {
      errors++
      if (errors <= 3) console.error('Erro na linha:', err.message)
    }
  }

  console.log('')
  console.log('✅ Importação concluída!')
  console.log(`   ✔  ${imported} registros importados/atualizados`)
  console.log(`   ⚠  ${skippedNeighborhood} ocorrências sem bairro correspondente no banco`)
  console.log(`   ❌  ${errors} erros`)

  if (unmatchedBairros.size > 0) {
    console.log('')
    console.log('📋 Bairros do CSV sem correspondência no banco (adicione ao seed se necessário):')
    ;[...unmatchedBairros].slice(0, 20).forEach(b => console.log(`   - ${b}`))
    if (unmatchedBairros.size > 20) console.log(`   ... e mais ${unmatchedBairros.size - 20}`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
