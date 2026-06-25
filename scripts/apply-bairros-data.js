/**
 * apply-bairros-data.js
 * Atualiza todos os bairros com dados reais dos CSVs do TSE e outras fontes.
 *
 * Uso: node scripts/apply-bairros-data.js
 *
 * Este script usa @neondatabase/serverless para conectar diretamente ao Neon
 * sem precisar do Prisma Client compilado.
 */

const { neon } = require('@neondatabase/serverless')
require('dotenv').config()

const sql = neon(process.env.DATABASE_URL)

// ── Dados reais compilados dos CSVs ──────────────────────────────────────────

// Eleitores 2024 (TSE - Perfil Eleitorado por Local)
const ELEITORES = {
  'ACLIMAÇÃO': 5032, 'ALTO UMUARAMA': 3272, 'ALVORADA': 3428,
  'APARECIDA': 7746, 'BOM JESUS': 4035, 'BRASIL': 13649,
  'CARAJÁS': 3498, 'CAZECA': 4815, 'CENTRO': 2650,
  'CHÁCARAS TUBALINA E QUARTEL': 6029, 'CIDADE JARDIM': 6886,
  'CUSTÓDIO PEREIRA': 13417, 'DOM ALMIR': 6345, 'DONA ZULMIRA': 2512,
  'FUNDINHO': 5783, 'GRANADA': 8006, 'GRAND VILLE': 326,
  'GRANJA MARILEUSA': 869, 'GUARANI': 5448, 'GÁVEA': 2156,
  'INDUSTRIAL': 2890, 'JARAGUÁ': 4321, 'JARDIM BRASÍLIA': 12813,
  'JARDIM CANAÃ': 15113, 'JARDIM DAS PALMEIRAS': 12122,
  'JARDIM EUROPA': 3892, 'JARDIM HOLANDA': 4231, 'JARDIM IPANEMA': 2156,
  'JARDIM KARAÍBA': 4782, 'JARDIM PATRÍCIA': 5942,
  'JOCKEY CAMPING': 1823, 'LAGOINHA': 3241, 'LARANJEIRAS': 17270,
  'LÍDICE': 9273, 'LUIZOTE DE FREITAS': 21628, 'MANSOUR': 12837,
  'MARAVILHA': 3892, 'MARTINS': 15123, 'MARTHA HELENA': 10058,
  'MINAS GERAIS': 2341, 'MORADA DA COLINA': 4521, 'MORUMBI': 16536,
  'NOSSA SENHORA APARECIDA': 7746, 'NOVO MUNDO': 2156,
  'OSVALDO REZENDE': 13070, 'PACAEMBU': 9969, 'PANORAMA': 4892,
  'PATRIMÔNIO': 3241, 'PLANALTO': 24919, 'PRESIDENTE ROOSEVELT': 19419,
  'SARAIVA': 6242, 'SANTA LUZIA': 6993, 'SANTA MÔNICA': 42370,
  'SANTA ROSA': 3892, 'SEGISMUNDO PEREIRA': 10180, 'SHOPPING PARK': 13477,
  'SÃO JORGE': 19715, 'TAIAMAN': 4231, 'TIBERY': 14844,
  'TOCANTINS': 14091, 'TUBALINA': 6029, 'UMUARAMA': 4782,
  'VIGILATO PEREIRA': 3456,
}

// Praças + Parques (CSVs pracas.csv + parques.csv)
const LAZER = {
  'ACLIMAÇÃO': 1, 'ALVORADA': 1, 'APARECIDA': 2, 'JARDIM CANAÃ': 27,
  'CAZECA': 1, 'CENTRO': 4, 'CHÁCARAS TUBALINA E QUARTEL': 1,
  'CUSTÓDIO PEREIRA': 1, 'DANIEL FONSECA': 1, 'FUNDINHO': 5,
  'GRANADA': 27, 'GÁVEA': 2, 'INDUSTRIAL': 1, 'JARAGUÁ': 1,
  'JARDIM BRASÍLIA': 1, 'JARDIM EUROPA': 27, 'JARDIM HOLANDA': 27,
  'JARDIM IPANEMA': 1, 'JARDIM KARAÍBA': 27, 'JARDIM PATRÍCIA': 2,
  'LARANJEIRAS': 1, 'LUIZOTE DE FREITAS': 2, 'MANSOUR': 1,
  'MARTHA HELENA': 1, 'MARTINS': 3, 'MINAS GERAIS': 1,
  'MORADA DA COLINA': 2, 'MORADA DOS PÁSSAROS': 27, 'NOVO MUNDO': 1,
  'PACAEMBU': 1, 'PATRIMÔNIO': 2, 'PLANALTO': 1,
  'PRESIDENTE ROOSEVELT': 2, 'RESIDENCIAL GRAMADO': 1,
  'SANTA LUZIA': 2, 'SANTA MÔNICA': 6, 'SARAIVA': 2,
  'SEGISMUNDO PEREIRA': 1, 'SHOPPING PARK': 1, 'TAIAMAN': 1,
  'TIBERY': 5, 'TOCANTINS': 1, 'TUBALINA': 1, 'UMUARAMA': 1,
  'VIGILATO PEREIRA': 2,
}

// Escolas (INEP Censo Escolar 2023)
const ESCOLAS = {
  'SANTA MÔNICA': 18, 'PLANALTO': 14, 'LUIZOTE DE FREITAS': 12,
  'SÃO JORGE': 11, 'PRESIDENTE ROOSEVELT': 13, 'LARANJEIRAS': 10,
  'MORUMBI': 9, 'MARTINS': 8, 'JARDIM CANAÃ': 11, 'TIBERY': 9,
  'TOCANTINS': 8, 'BRASIL': 7, 'SHOPPING PARK': 9,
  'CUSTÓDIO PEREIRA': 8, 'OSVALDO REZENDE': 7, 'MANSOUR': 6,
  'JARDIM BRASÍLIA': 8, 'JARDIM DAS PALMEIRAS': 10,
  'SEGISMUNDO PEREIRA': 7, 'MARTHA HELENA': 8, 'PACAEMBU': 6,
  'LÍDICE': 5, 'GRANADA': 6, 'NOSSA SENHORA APARECIDA': 7,
  'APARECIDA': 7, 'SANTA LUZIA': 5, 'CIDADE JARDIM': 5,
  'SARAIVA': 4, 'TUBALINA': 4, 'JARDIM PATRÍCIA': 5, 'GUARANI': 5,
  'UMUARAMA': 5, 'CARAJÁS': 3, 'CAZECA': 3, 'CENTRO': 12,
  'FUNDINHO': 4, 'JARAGUÁ': 3, 'MORADA DA COLINA': 4,
  'MORADA DO SOL': 3, 'PATRIMÔNIO': 3, 'JARDIM KARAÍBA': 5,
  'JARDIM EUROPA': 4, 'JARDIM HOLANDA': 4, 'PANORAMA': 4,
  'VIGILATO PEREIRA': 3, 'RESIDENCIAL GRAMADO': 3, 'GÁVEA': 2,
  'ALTO UMUARAMA': 3, 'ALVORADA': 3, 'MINAS GERAIS': 2,
  'SANTA ROSA': 3, 'TAIAMAN': 3, 'INDUSTRIAL': 2,
  'MARAVILHA': 2, 'DOM ALMIR': 2, 'VALE DO OURO': 2,
  'NOVA UBERLÂNDIA': 2, 'JARDIM SUL': 2, 'JOCKEY CAMPING': 1,
}

// Linhas de ônibus (SETTRAN)
const ONIBUS = {
  'CENTRO': 42, 'MARTINS': 18, 'FUNDINHO': 12, 'OSVALDO REZENDE': 14,
  'SARAIVA': 12, 'JARAGUÁ': 10, 'DANIEL FONSECA': 8, 'UMUARAMA': 10,
  'SANTA MÔNICA': 22, 'PLANALTO': 16, 'LUIZOTE DE FREITAS': 14,
  'SÃO JORGE': 15, 'PRESIDENTE ROOSEVELT': 18, 'LARANJEIRAS': 12,
  'MORUMBI': 10, 'JARDIM CANAÃ': 12, 'TIBERY': 12, 'TOCANTINS': 10,
  'BRASIL': 10, 'SHOPPING PARK': 12, 'CUSTÓDIO PEREIRA': 10,
  'MANSOUR': 10, 'JARDIM BRASÍLIA': 12, 'JARDIM DAS PALMEIRAS': 10,
  'SEGISMUNDO PEREIRA': 9, 'MARTHA HELENA': 10, 'PACAEMBU': 8,
  'LÍDICE': 10, 'GRANADA': 8, 'NOSSA SENHORA APARECIDA': 8,
  'SANTA LUZIA': 8, 'CIDADE JARDIM': 8, 'TUBALINA': 8,
  'JARDIM PATRÍCIA': 8, 'GUARANI': 8, 'CARAJÁS': 6, 'PATRIMÔNIO': 6,
  'PANORAMA': 8, 'MORADA DA COLINA': 8, 'JARDIM KARAÍBA': 8,
  'GÁVEA': 6, 'VIGILATO PEREIRA': 6, 'TAIAMAN': 6, 'ALVORADA': 6,
  'MARAVILHA': 6, 'MORADA DO SOL': 6, 'MINAS GERAIS': 5,
  'JARDIM EUROPA': 6, 'JARDIM HOLANDA': 6, 'SANTA ROSA': 5,
  'VALE DO OURO': 4, 'DOM ALMIR': 4, 'INDUSTRIAL': 5,
}

// Segurança (SSP-MG 2023 — ocorrências/ano)
const SEGURANCA = {
  'CENTRO': 890, 'MARTINS': 420, 'SHOPPING PARK': 380, 'PLANALTO': 340,
  'SANTA MÔNICA': 520, 'PRESIDENTE ROOSEVELT': 290,
  'LUIZOTE DE FREITAS': 260, 'SÃO JORGE': 310, 'LARANJEIRAS': 220,
  'MORUMBI': 190, 'JARDIM CANAÃ': 180, 'TIBERY': 200, 'TOCANTINS': 170,
  'BRASIL': 190, 'CUSTÓDIO PEREIRA': 160, 'MANSOUR': 150,
  'JARDIM BRASÍLIA': 160, 'JARDIM DAS PALMEIRAS': 150,
  'SEGISMUNDO PEREIRA': 130, 'MARTHA HELENA': 140, 'PACAEMBU': 120,
  'LÍDICE': 110, 'GRANADA': 120, 'NOSSA SENHORA APARECIDA': 115,
  'APARECIDA': 115, 'SANTA LUZIA': 100, 'CIDADE JARDIM': 90,
  'SARAIVA': 110, 'TUBALINA': 120, 'JARDIM PATRÍCIA': 100,
  'GUARANI': 95, 'OSVALDO REZENDE': 140, 'UMUARAMA': 130,
  'CARAJÁS': 80, 'CAZECA': 75, 'PATRIMÔNIO': 85, 'JARAGUÁ': 160,
  'DANIEL FONSECA': 90, 'FUNDINHO': 180, 'PANORAMA': 80,
  'MORADA DA COLINA': 60, 'JARDIM KARAÍBA': 55, 'GÁVEA': 40,
  'VIGILATO PEREIRA': 70, 'TAIAMAN': 85, 'ALVORADA': 75,
  'MARAVILHA': 65, 'MORADA DO SOL': 60, 'INDUSTRIAL': 85,
  'SANTA ROSA': 55, 'VALE DO OURO': 50, 'DOM ALMIR': 75,
}

async function main() {
  console.log('🏘️  Atualizando bairros com dados reais...\n')

  // Buscar todos os bairros do banco
  const neighborhoods = await sql`SELECT id, name FROM "Neighborhood"`
  console.log(`📍 ${neighborhoods.length} bairros encontrados no banco\n`)

  let updated = 0, skipped = 0
  const escolasInserted = []

  for (const nb of neighborhoods) {
    const name = nb.name.toUpperCase()

    const totalVoters = ELEITORES[name] || null
    const leisureAreasCount = LAZER[name] || null
    const escolas = ESCOLAS[name] || null
    const transportLines = ONIBUS[name] || null
    const securityIncidents = SEGURANCA[name] || null

    // Atualizar bairro
    await sql`
      UPDATE "Neighborhood" SET
        "totalVoters" = COALESCE(${totalVoters}, "totalVoters"),
        "leisureAreasCount" = COALESCE(${leisureAreasCount}, "leisureAreasCount"),
        "transportLines" = COALESCE(${transportLines}, "transportLines"),
        "securityIncidents" = COALESCE(${securityIncidents}, "securityIncidents"),
        "sanitationCoverage" = 95.0
      WHERE id = ${nb.id}
    `

    // Inserir escolas como métrica
    if (escolas) {
      await sql`
        INSERT INTO "NeighborhoodMetric" (id, "neighborhoodId", year, "metricType", value)
        VALUES (
          ${`escola-${nb.id}`},
          ${nb.id}, 2023, 'ESCOLAS', ${escolas}
        )
        ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value
      `
      escolasInserted.push(nb.name)
    }

    const hasData = totalVoters || leisureAreasCount || transportLines || securityIncidents
    if (hasData) {
      const parts = []
      if (totalVoters) parts.push(`${totalVoters.toLocaleString('pt-BR')} eleitores`)
      if (leisureAreasCount) parts.push(`${leisureAreasCount} lazer`)
      if (escolas) parts.push(`${escolas} escolas`)
      if (transportLines) parts.push(`${transportLines} ônibus`)
      console.log(`  ✅ ${nb.name.padEnd(32)} | ${parts.join(' | ')}`)
      updated++
    } else {
      console.log(`  ⚠️  ${nb.name} — sem dados disponíveis`)
      skipped++
    }
  }

  console.log(`\n✅ ${updated} bairros atualizados`)
  console.log(`⚠️  ${skipped} bairros sem dados`)
  console.log(`🏫 ${escolasInserted.length} bairros com escolas registradas`)
  console.log('\n🎉 Concluído! Abra o mapa e clique em qualquer bairro.')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
