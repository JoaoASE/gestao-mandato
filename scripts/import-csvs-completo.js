/**
 * import-csvs-completo.js
 * Importa todos os CSVs para o banco de dados do Neon.
 *
 * Uso: node scripts/import-csvs-completo.js
 *
 * Importa:
 * - Candidatos TSE (3.989 registros)
 * - Resultado por Seção (45.513 registros)
 * - Detalhes por Seção (37.310 registros)
 * - Perfil Eleitorado por Local (17.962 registros)
 * - Partidos (491 registros)
 * - Praças (227 registros) → LeisureArea
 * - Parques (9 registros) → LeisureArea
 * - Eleitores por bairro (agregado do Perfil) → Neighborhood
 * - População por grupo/sexo/raça → PopulacaoMunicipio
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const csv = require('csv-parser')

const prisma = new PrismaClient()

function normalizeStr(s) {
  return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : ''
}

function readCSV(path, encoding = 'utf-8') {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(path, { encoding })
      .pipe(csv())
      .on('data', r => rows.push(r))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

async function importCandidatos() {
  console.log('\n👤 Importando candidatos TSE...')
  const rows = await readCSV('Candidatos Uberlandia.csv')

  let imported = 0, skipped = 0
  const BATCH = 200

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const data = batch.map(r => ({
      ano: parseInt(r.ano) || 0,
      sequencial: r.sequencial || '',
      numero: r.numero || '',
      nome: r.nome || '',
      nomeUrna: r.nome_urna || '',
      numeroPartido: r.numero_partido || '',
      siglaPartido: r.sigla_partido || '',
      cargo: r.cargo || '',
      situacao: r.situacao || '',
      genero: r.genero || null,
      idade: parseInt(r.idade) || null,
      instrucao: r.instrucao || null,
      ocupacao: r.ocupacao || null,
      estadoCivil: r.estado_civil || null,
      raca: r.raca || null,
      email: r.email || null,
    })).filter(r => r.ano > 0 && r.sequencial)

    await prisma.tseCandidato.createMany({ data, skipDuplicates: true })
    imported += data.length
    process.stdout.write(`\r   ${imported}/${rows.length} candidatos...`)
  }
  console.log(`\n   ✅ ${imported} candidatos importados`)
}

async function importResultadoSecao() {
  console.log('\n🗳️  Importando resultados por seção...')
  const rows = await readCSV('Resultado Candidato por Secao Uberlandia.csv')

  let imported = 0
  const BATCH = 500

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const data = batch.map(r => ({
      ano: parseInt(r.ano) || 0,
      turno: parseInt(r.turno) || 1,
      zona: r.zona || '',
      secao: r.secao || '',
      cargo: r.cargo || '',
      siglaPartido: r.sigla_partido || '',
      numeroCandidato: r.numero_candidato || '',
      sequencialCandidato: r.sequencial_candidato || '',
      votos: parseInt(r.votos) || 0,
    })).filter(r => r.ano > 0)

    await prisma.tseResultadoSecao.createMany({ data, skipDuplicates: true })
    imported += data.length
    process.stdout.write(`\r   ${imported}/${rows.length} resultados...`)
  }
  console.log(`\n   ✅ ${imported} resultados por seção importados`)
}

async function importDetalhesSecao() {
  console.log('\n📊 Importando detalhes por seção...')
  const rows = await readCSV('Detalhes Secao Eleitoral Uberlandia.csv')

  let imported = 0
  const BATCH = 500

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const data = batch.map(r => ({
      ano: parseInt(r.ano) || 0,
      turno: parseInt(r.turno) || 1,
      zona: r.zona || '',
      secao: r.secao || '',
      cargo: r.cargo || '',
      aptos: parseInt(r.aptos) || 0,
      comparecimento: parseInt(r.comparecimento) || 0,
      abstencoes: parseInt(r.abstencoes) || 0,
      votosNominais: parseInt(r.votos_nominais) || 0,
      votosBrancos: parseInt(r.votos_brancos) || 0,
      votosNulos: parseInt(r.votos_nulos) || 0,
      proporcaoComparecimento: parseFloat(r.proporcao_comparecimento) || null,
    })).filter(r => r.ano > 0)

    await prisma.tseDetalhesSecao.createMany({ data, skipDuplicates: true })
    imported += data.length
    process.stdout.write(`\r   ${imported}/${rows.length} detalhes...`)
  }
  console.log(`\n   ✅ ${imported} detalhes por seção importados`)
}

async function importPerfilEleitorado() {
  console.log('\n👥 Importando perfil do eleitorado...')
  const rows = await readCSV('Perfil Eleitorado por Local Uberlandia.csv')

  let imported = 0
  const BATCH = 300

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const data = batch.map(r => ({
      ano: parseInt(r.ano) || 0,
      turno: parseInt(r.turno) || 1,
      zona: r.zona || '',
      secao: r.secao || '',
      nome: r.nome || '',
      tipo: r.tipo || null,
      endereco: r.endereco || null,
      bairro: r.bairro || null,
      latitude: parseFloat(r.latitude) || null,
      longitude: parseFloat(r.longitude) || null,
      eleitores: parseInt(r.eleitores_secao) || 0,
    })).filter(r => r.ano > 0)

    await prisma.tsePerfilEleitorado.createMany({ data, skipDuplicates: true })
    imported += data.length
    process.stdout.write(`\r   ${imported}/${rows.length} seções...`)
  }
  console.log(`\n   ✅ ${imported} seções do perfil importadas`)

  // Agregar eleitores 2024 por bairro → atualizar Neighborhood
  console.log('\n   📍 Atualizando eleitores por bairro...')
  const eleitores2024 = await prisma.tsePerfilEleitorado.groupBy({
    by: ['bairro'],
    where: { ano: 2024, bairro: { not: null } },
    _sum: { eleitores: true },
  })

  const city = await prisma.city.findFirst({ where: { name: { contains: 'Uberlândia', mode: 'insensitive' } } })
  if (!city) return

  const neighborhoods = await prisma.neighborhood.findMany({ where: { cityId: city.id } })
  const nbMap = new Map(neighborhoods.map(n => [normalizeStr(n.name), n.id]))

  let updated = 0
  for (const { bairro, _sum } of eleitores2024) {
    if (!bairro || !_sum.eleitores) continue
    const bNorm = normalizeStr(bairro)
    let nbId = nbMap.get(bNorm)
    if (!nbId) {
      for (const [k, v] of nbMap) {
        if (k.includes(bNorm) || bNorm.includes(k)) { nbId = v; break }
      }
    }
    if (nbId) {
      await prisma.neighborhood.update({ where: { id: nbId }, data: { totalVoters: _sum.eleitores } })
      updated++
    }
  }
  console.log(`   ✅ ${updated} bairros atualizados com eleitores reais 2024`)
}

async function importPartidos() {
  console.log('\n🏛️  Importando partidos...')
  const rows = await readCSV('Partidos Uberlandia.csv')
  const data = rows.map(r => ({
    ano: parseInt(r.ano) || 0,
    sigla: r.sigla || '',
    nome: r.nome || '',
    cargo: r.cargo || '',
    situacaoLegenda: r.situacao_legenda || null,
    nomeColigacao: r.nome_coligacao || null,
  })).filter(r => r.ano > 0 && r.sigla)

  await prisma.tsePartido.createMany({ data, skipDuplicates: true })
  console.log(`   ✅ ${data.length} partidos importados`)
}

async function importPracasParques() {
  console.log('\n🌳 Importando praças e parques...')

  const city = await prisma.city.findFirst({ where: { name: { contains: 'Uberlândia', mode: 'insensitive' } } })
  if (!city) return
  const neighborhoods = await prisma.neighborhood.findMany({ where: { cityId: city.id } })
  const nbMap = new Map(neighborhoods.map(n => [normalizeStr(n.name), n.id]))

  function findNeighborhood(bairro) {
    const bNorm = normalizeStr(bairro)
    let nbId = nbMap.get(bNorm)
    if (!nbId) {
      for (const [k, v] of nbMap) {
        if (k.includes(bNorm) || bNorm.includes(k)) { nbId = v; break }
      }
    }
    return nbId
  }

  // Praças
  const pracas = await readCSV('pracas.csv')
  let pracasImported = 0, pracasSkipped = 0
  const bairroLazerCount = {}

  for (const r of pracas) {
    const bairro = r['Bairro'] || r.Bairro || ''
    const nome = r['Nome'] || r.Nome || ''
    const rua = r['Rua'] || r.Rua || ''
    const nbId = findNeighborhood(bairro)
    if (!nbId) { pracasSkipped++; continue }
    bairroLazerCount[nbId] = (bairroLazerCount[nbId] || 0) + 1

    await prisma.leisureArea.upsert({
      where: { id: `praca-${normalizeStr(nome)}` },
      update: { name: nome, street: rua || null, neighborhoodId: nbId },
      create: { id: `praca-${normalizeStr(nome)}`, name: nome, type: 'PRACA', street: rua || null, neighborhoodId: nbId }
    })
    pracasImported++
  }

  // Parques
  const parques = await readCSV('parques.csv')
  let parquesImported = 0
  for (const r of parques) {
    const bairro = r['Bairro'] || r.Bairro || ''
    const nome = r['Nome do Parque'] || r['Nome'] || ''
    const rua = r['Rua'] || r.Rua || ''
    const nbId = findNeighborhood(bairro)
    if (!nbId) continue
    bairroLazerCount[nbId] = (bairroLazerCount[nbId] || 0) + 1

    await prisma.leisureArea.upsert({
      where: { id: `parque-${normalizeStr(nome)}` },
      update: { name: nome, street: rua || null, neighborhoodId: nbId },
      create: { id: `parque-${normalizeStr(nome)}`, name: nome, type: 'PARQUE', street: rua || null, neighborhoodId: nbId }
    })
    parquesImported++
  }

  // Atualizar contagem de lazer nos bairros
  for (const [nbId, count] of Object.entries(bairroLazerCount)) {
    await prisma.neighborhood.update({ where: { id: nbId }, data: { leisureAreasCount: count } })
  }

  console.log(`   ✅ ${pracasImported} praças (${pracasSkipped} sem bairro correspondente)`)
  console.log(`   ✅ ${parquesImported} parques`)
  console.log(`   ✅ ${Object.keys(bairroLazerCount).length} bairros com contagem de lazer atualizada`)
}

async function importPopulacao() {
  console.log('\n👨‍👩‍👧 Importando população por grupo...')
  const rows = await readCSV('Populacao Uberlandia 2022.csv')
  const data = rows.map(r => ({
    ano: parseInt(r.ano) || 2022,
    grupoIdade: r.grupo_idade || '',
    sexo: r.sexo || '',
    corRaca: r.cor_raca || '',
    populacao: parseInt(r.populacao) || 0,
  })).filter(r => r.grupoIdade && r.populacao > 0)

  await prisma.populacaoMunicipio.createMany({ data, skipDuplicates: true })
  console.log(`   ✅ ${data.length} grupos populacionais importados`)

  // Atualizar demographics no JSON público
  const totalPop = data.reduce((s, r) => s + r.populacao, 0)
  const homens = data.filter(r => r.sexo === 'Homens').reduce((s, r) => s + r.populacao, 0)
  const mulheres = data.filter(r => r.sexo === 'Mulheres').reduce((s, r) => s + r.populacao, 0)

  const racas = {}
  for (const r of data) {
    racas[r.corRaca] = (racas[r.corRaca] || 0) + r.populacao
  }

  const demographics = {
    populacao_total: totalPop,
    sexo_percent: {
      Homens: parseFloat((homens / totalPop).toFixed(4)),
      Mulheres: parseFloat((mulheres / totalPop).toFixed(4)),
    },
    raca_percent: Object.fromEntries(
      Object.entries(racas).map(([k, v]) => [k, parseFloat((v / totalPop).toFixed(4))])
    ),
    fonte: 'IBGE Censo 2022',
    ano: 2022,
  }

  require('fs').writeFileSync(
    'public/uberlandia_demographics.json',
    JSON.stringify(demographics, null, 2)
  )
  console.log(`   ✅ demographics.json atualizado (pop. total: ${totalPop.toLocaleString('pt-BR')})`)
}

async function main() {
  console.log('🚀 Iniciando importação completa dos CSVs...')
  console.log('   Banco: Neon PostgreSQL\n')

  await importCandidatos()
  await importResultadoSecao()
  await importDetalhesSecao()
  await importPerfilEleitorado()
  await importPartidos()
  await importPracasParques()
  await importPopulacao()

  console.log('\n🎉 Importação completa!')
  console.log('   Acesse /relatorios para visualizar os dados.')
  await prisma.$disconnect()
}

main().catch(e => { console.error('\n❌ Erro:', e.message); process.exit(1) })
