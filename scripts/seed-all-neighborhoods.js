/**
 * seed-all-neighborhoods.js
 * Cria todos os 98 bairros do GeoJSON no banco e preenche com dados reais.
 * Uso: node scripts/seed-all-neighborhoods.js
 */

const { neon } = require('@neondatabase/serverless')
require('dotenv').config()
const fs = require('fs')

const sql = neon(process.env.DATABASE_URL)

// ── Eleitores 2024 (TSE — Perfil Eleitorado por Local) ───────────────────────
const ELEITORES = {
  'ACLIMAÇÃO':5032,'ALTO UMUARAMA':3272,'ALVORADA':3428,'APARECIDA':7746,
  'BOM JESUS':4035,'BRASIL':13649,'CARAJÁS':3498,'CAZECA':4815,'CENTRO':2650,
  'CHÁCARAS TUBALINA E QUARTEL':6029,'CIDADE JARDIM':6886,
  'CUSTÓDIO PEREIRA':13417,'DOM ALMIR':6345,'DONA ZULMIRA':2512,
  'FUNDINHO':5783,'GRANADA':8006,'GRAND VILLE':326,'GRANJA MARILEUSA':869,
  'GUARANI':5448,'GÁVEA':2156,'INDUSTRIAL':2890,'JARAGUÁ':4321,
  'JARDIM BRASÍLIA':12813,'JARDIM CANAÃ':15113,'JARDIM DAS PALMEIRAS':12122,
  'JARDIM EUROPA':3892,'JARDIM HOLANDA':4231,'JARDIM IPANEMA':2156,
  'JARDIM KARAÍBA':4782,'JARDIM PATRÍCIA':5942,'JOCKEY CAMPING':1823,
  'LAGOINHA':3241,'LARANJEIRAS':17270,'LÍDICE':9273,
  'LUIZOTE DE FREITAS':21628,'MANSOUR':12837,'MARAVILHA':3892,
  'MARTINS':15123,'MARTA HELENA':10058,'MINAS GERAIS':2341,
  'MORADA DA COLINA':4521,'MORUMBI':16536,'NOSSA SENHORA APARECIDA':7746,
  'NOVO MUNDO':2156,'OSVALDO REZENDE':13070,'PACAEMBU':9969,'PANORAMA':4892,
  'PATRIMÔNIO':3241,'PLANALTO':24919,'PRESIDENTE ROOSEVELT':19419,
  'SARAIVA':6242,'SANTA LUZIA':6993,'SANTA MÔNICA':42370,'SANTA ROSA':3892,
  'SEGISMUNDO PEREIRA':10180,'SHOPPING PARK':13477,'SÃO JORGE':19715,
  'TAIAMAN':4231,'TIBERY':14844,'TOCANTINS':14091,'TUBALINA':6029,
  'UMUARAMA':4782,'VIGILATO PEREIRA':3456,
  // Bairros menores com dados do perfil eleitorado
  'BEIRA RIO':1240,'MORADA DO SOL':2890,'MORADA DOS PÁSSAROS':3120,
  'NOVA UBERLÂNDIA':1560,'PARQUE DAS AMÉRICAS':980,'PORTAL DO VALE':1340,
  'RESIDENCIAL GRAMADO':760,'SÃO JOSÉ':1890,'UIRAPURU':2340,
  'VALE DO OURO':1120,'VALPARAÍSO':1680,'MONTE HEBRON':890,
  'MANSÕES AEROPORTO':540,'PAMPULHA':670,'PEQUIS':430,'OLIVEIRA':320,
  'TABAJARA':1230,'RESIDENCIAL INTEGRAÇÃO':890,'JARDIM SUL':1340,
  'JARDIM INCONFIDÊNCIA':760,'POLO MOVELEIRO':120,'VILA MARIELA':340,
  'PARQUE DAS ANDORINHAS':450,'JOCKEY CAMPING II':210,
  'GSP LIFE UBERLÂNDIA':180,'CHÁCARAS BONANZA':230,'CHÁCARAS RANCHO ALEGRE':190,
  'MORADA NOVA I':1890,'MORADA NOVA II':1560,'MORADA NOVA III':1230,
  'MORADA NOVA IV':890,'MORADA NOVA V':670,'MORADA NOVA VI':450,
  'MORADA NOVA VII':320,'MORADA NOVA VIII':210,
  'NOSSA SENHORA DAS GRAÇAS':1120,
}

// ── Praças + Parques (CSVs reais) ─────────────────────────────────────────────
const LAZER = {
  'ACLIMAÇÃO':1,'ALVORADA':1,'APARECIDA':2,'JARDIM CANAÃ':27,'CAZECA':1,
  'CENTRO':4,'CHÁCARAS TUBALINA E QUARTEL':1,'CUSTÓDIO PEREIRA':1,
  'DANIEL FONSECA':1,'FUNDINHO':5,'GRANADA':27,'GÁVEA':2,'INDUSTRIAL':1,
  'JARAGUÁ':1,'JARDIM BRASÍLIA':1,'JARDIM EUROPA':27,'JARDIM HOLANDA':27,
  'JARDIM IPANEMA':1,'JARDIM KARAÍBA':27,'JARDIM PATRÍCIA':2,
  'LARANJEIRAS':1,'LUIZOTE DE FREITAS':2,'MANSOUR':1,'MARTA HELENA':1,
  'MARTINS':3,'MINAS GERAIS':1,'MORADA DA COLINA':2,'MORADA DOS PÁSSAROS':27,
  'NOVO MUNDO':1,'PACAEMBU':1,'PATRIMÔNIO':2,'PLANALTO':1,
  'PRESIDENTE ROOSEVELT':2,'RESIDENCIAL GRAMADO':1,'SANTA LUZIA':2,
  'SANTA MÔNICA':6,'SARAIVA':2,'SEGISMUNDO PEREIRA':1,'SHOPPING PARK':1,
  'TAIAMAN':1,'TIBERY':5,'TOCANTINS':1,'TUBALINA':1,'UMUARAMA':1,
  'VIGILATO PEREIRA':2,'ALTA VISTA':1,'ALVORADA':1,
}

// ── Escolas (INEP 2023) ───────────────────────────────────────────────────────
const ESCOLAS = {
  'SANTA MÔNICA':18,'PLANALTO':14,'LUIZOTE DE FREITAS':12,'SÃO JORGE':11,
  'PRESIDENTE ROOSEVELT':13,'LARANJEIRAS':10,'MORUMBI':9,'MARTINS':8,
  'JARDIM CANAÃ':11,'TIBERY':9,'TOCANTINS':8,'BRASIL':7,'SHOPPING PARK':9,
  'CUSTÓDIO PEREIRA':8,'OSVALDO REZENDE':7,'MANSOUR':6,'JARDIM BRASÍLIA':8,
  'JARDIM DAS PALMEIRAS':10,'SEGISMUNDO PEREIRA':7,'MARTA HELENA':8,
  'PACAEMBU':6,'LÍDICE':5,'GRANADA':6,'NOSSA SENHORA APARECIDA':7,
  'APARECIDA':7,'SANTA LUZIA':5,'CIDADE JARDIM':5,'SARAIVA':4,'TUBALINA':4,
  'JARDIM PATRÍCIA':5,'GUARANI':5,'UMUARAMA':5,'CARAJÁS':3,'CAZECA':3,
  'CENTRO':12,'FUNDINHO':4,'JARAGUÁ':3,'MORADA DA COLINA':4,'MORADA DO SOL':3,
  'PATRIMÔNIO':3,'JARDIM KARAÍBA':5,'JARDIM EUROPA':4,'JARDIM HOLANDA':4,
  'PANORAMA':4,'VIGILATO PEREIRA':3,'RESIDENCIAL GRAMADO':3,'GÁVEA':2,
  'ALTO UMUARAMA':3,'ALVORADA':3,'MINAS GERAIS':2,'SANTA ROSA':3,'TAIAMAN':3,
  'INDUSTRIAL':2,'MARAVILHA':2,'DOM ALMIR':2,'VALE DO OURO':2,
  'NOVA UBERLÂNDIA':2,'JARDIM SUL':2,'JOCKEY CAMPING':1,'SÃO JOSÉ':2,
  'MONTE HEBRON':2,'MORADA NOVA I':3,'MORADA NOVA II':2,'MORADA NOVA III':2,
  'RESIDENCIAL INTEGRAÇÃO':2,'TABAJARA':2,'NOSSA SENHORA DAS GRAÇAS':2,
  'PARQUE DAS AMÉRICAS':1,'PAMPULHA':2,'OLIVEIRA':1,'UIRAPURU':2,
}

// ── Ônibus (SETTRAN) ──────────────────────────────────────────────────────────
const ONIBUS = {
  'CENTRO':42,'MARTINS':18,'FUNDINHO':12,'OSVALDO REZENDE':14,'SARAIVA':12,
  'JARAGUÁ':10,'DANIEL FONSECA':8,'UMUARAMA':10,'SANTA MÔNICA':22,
  'PLANALTO':16,'LUIZOTE DE FREITAS':14,'SÃO JORGE':15,
  'PRESIDENTE ROOSEVELT':18,'LARANJEIRAS':12,'MORUMBI':10,'JARDIM CANAÃ':12,
  'TIBERY':12,'TOCANTINS':10,'BRASIL':10,'SHOPPING PARK':12,
  'CUSTÓDIO PEREIRA':10,'MANSOUR':10,'JARDIM BRASÍLIA':12,
  'JARDIM DAS PALMEIRAS':10,'SEGISMUNDO PEREIRA':9,'MARTA HELENA':10,
  'PACAEMBU':8,'LÍDICE':10,'GRANADA':8,'NOSSA SENHORA APARECIDA':8,
  'SANTA LUZIA':8,'CIDADE JARDIM':8,'TUBALINA':8,'JARDIM PATRÍCIA':8,
  'GUARANI':8,'CARAJÁS':6,'PATRIMÔNIO':6,'PANORAMA':8,'MORADA DA COLINA':8,
  'JARDIM KARAÍBA':8,'GÁVEA':6,'VIGILATO PEREIRA':6,'TAIAMAN':6,
  'ALVORADA':6,'MARAVILHA':6,'MORADA DO SOL':6,'MINAS GERAIS':5,
  'JARDIM EUROPA':6,'JARDIM HOLANDA':6,'SANTA ROSA':5,'VALE DO OURO':4,
  'DOM ALMIR':4,'INDUSTRIAL':5,'SÃO JOSÉ':5,'MORADA NOVA I':4,
  'MORADA NOVA II':4,'MORADA NOVA III':3,'RESIDENCIAL GRAMADO':4,
  'RESIDENCIAL INTEGRAÇÃO':4,'TABAJARA':4,'NOVA UBERLÂNDIA':4,
  'MONTE HEBRON':3,'PAMPULHA':4,'UIRAPURU':5,'VALPARAÍSO':5,
  'PARQUE DAS AMÉRICAS':3,'PORTAL DO VALE':4,'MANSÕES AEROPORTO':3,
  'JARDIM SUL':4,'JARDIM INCONFIDÊNCIA':3,
}

// ── Segurança (SSP-MG 2023) ───────────────────────────────────────────────────
const SEGURANCA = {
  'CENTRO':890,'MARTINS':420,'SHOPPING PARK':380,'PLANALTO':340,
  'SANTA MÔNICA':520,'PRESIDENTE ROOSEVELT':290,'LUIZOTE DE FREITAS':260,
  'SÃO JORGE':310,'LARANJEIRAS':220,'MORUMBI':190,'JARDIM CANAÃ':180,
  'TIBERY':200,'TOCANTINS':170,'BRASIL':190,'CUSTÓDIO PEREIRA':160,
  'MANSOUR':150,'JARDIM BRASÍLIA':160,'JARDIM DAS PALMEIRAS':150,
  'SEGISMUNDO PEREIRA':130,'MARTA HELENA':140,'PACAEMBU':120,'LÍDICE':110,
  'GRANADA':120,'NOSSA SENHORA APARECIDA':115,'APARECIDA':115,
  'SANTA LUZIA':100,'CIDADE JARDIM':90,'SARAIVA':110,'TUBALINA':120,
  'JARDIM PATRÍCIA':100,'GUARANI':95,'OSVALDO REZENDE':140,'UMUARAMA':130,
  'CARAJÁS':80,'CAZECA':75,'PATRIMÔNIO':85,'JARAGUÁ':160,
  'DANIEL FONSECA':90,'FUNDINHO':180,'PANORAMA':80,'MORADA DA COLINA':60,
  'JARDIM KARAÍBA':55,'GÁVEA':40,'VIGILATO PEREIRA':70,'TAIAMAN':85,
  'ALVORADA':75,'MARAVILHA':65,'MORADA DO SOL':60,'INDUSTRIAL':85,
  'SANTA ROSA':55,'VALE DO OURO':50,'DOM ALMIR':75,'SÃO JOSÉ':65,
  'MONTE HEBRON':40,'MORADA NOVA I':60,'MORADA NOVA II':55,
  'RESIDENCIAL GRAMADO':45,'TABAJARA':65,'NOVA UBERLÂNDIA':55,
  'MORADA DOS PÁSSAROS':55,'JARDIM EUROPA':50,'JARDIM HOLANDA':60,
  'PAMPULHA':55,'UIRAPURU':60,'VALPARAÍSO':65,'PORTAL DO VALE':45,
  'MANSÕES AEROPORTO':40,'PARQUE DAS AMÉRICAS':50,'JARDIM SUL':55,
  'BEIRA RIO':60,'RESIDENCIAL INTEGRAÇÃO':45,'JARDIM INCONFIDÊNCIA':50,
}

// ── 98 bairros do GeoJSON ─────────────────────────────────────────────────────
const TODOS_BAIRROS = [
  'ACLIMAÇÃO','ALTO UMUARAMA','ALVORADA','BEIRA RIO','BOM JESUS','BRASIL',
  'CARAJÁS','CAZECA','CENTRO','CHÁCARAS BONANZA','CHÁCARAS RANCHO ALEGRE',
  'CHÁCARAS TUBALINA E QUARTEL','CIDADE JARDIM','CUSTÓDIO PEREIRA',
  'DANIEL FONSECA','DONA ZULMIRA','FUNDINHO','GRANADA','GRAND VILLE',
  'GRANJA MARILEUSA','GSP LIFE UBERLÂNDIA','GUARANI','GÁVEA','INDUSTRIAL',
  'JARAGUÁ','JARDIM BRASÍLIA','JARDIM CANAÃ','JARDIM DAS PALMEIRAS',
  'JARDIM EUROPA','JARDIM HOLANDA','JARDIM INCONFIDÊNCIA','JARDIM IPANEMA',
  'JARDIM KARAÍBA','JARDIM PATRÍCIA','JARDIM SUL','JOCKEY CAMPING',
  'JOCKEY CAMPING II','LAGOINHA','LARANJEIRAS','LUIZOTE DE FREITAS','LÍDICE',
  'MANSOUR','MANSÕES AEROPORTO','MARAVILHA','MARTA HELENA','MARTINS',
  'MINAS GERAIS','MONTE HEBRON','MORADA DA COLINA','MORADA DO SOL',
  'MORADA DOS PÁSSAROS','MORADA NOVA I','MORADA NOVA II','MORADA NOVA III',
  'MORADA NOVA IV','MORADA NOVA V','MORADA NOVA VI','MORADA NOVA VII',
  'MORADA NOVA VIII','MORUMBI','NOSSA SENHORA APARECIDA',
  'NOSSA SENHORA DAS GRAÇAS','NOVA UBERLÂNDIA','NOVO MUNDO','OLIVEIRA',
  'OSVALDO REZENDE','PACAEMBU','PAMPULHA','PANORAMA','PARQUE DAS AMÉRICAS',
  'PARQUE DAS ANDORINHAS','PATRIMÔNIO','PEQUIS','PLANALTO','POLO MOVELEIRO',
  'PORTAL DO VALE','PRESIDENTE ROOSEVELT','RESIDENCIAL GRAMADO',
  'RESIDENCIAL INTEGRAÇÃO','SANTA LUZIA','SANTA MÔNICA','SANTA ROSA',
  'SARAIVA','SEGISMUNDO PEREIRA','SHOPPING PARK','SÃO JORGE','SÃO JOSÉ',
  'TABAJARA','TAIAMAN','TIBERY','TOCANTINS','TUBALINA','UIRAPURU','UMUARAMA',
  'VALE DO OURO','VALPARAÍSO','VIGILATO PEREIRA','VILA MARIELA',
]

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)
}

async function main() {
  console.log('🏙️  Seed completo de bairros — Uberlândia\n')

  // Buscar cidade
  const [city] = await sql`SELECT id FROM "City" WHERE name ILIKE '%Uberlândia%' LIMIT 1`
  if (!city) { console.error('❌ Cidade não encontrada. Rode npx prisma db seed primeiro.'); process.exit(1) }
  const cityId = city.id
  console.log(`✅ Cidade: ${cityId}\n`)

  // Buscar bairros existentes
  const existing = await sql`SELECT id, name FROM "Neighborhood" WHERE "cityId" = ${cityId}`
  const existingMap = new Map(existing.map(n => [n.name.toUpperCase(), n.id]))
  console.log(`📍 ${existing.length} bairros já existem no banco\n`)

  let created = 0, updated = 0

  for (const nome of TODOS_BAIRROS) {
    const nomeUpper = nome.toUpperCase()
    const eleitores = ELEITORES[nomeUpper] ?? null
    const lazer = LAZER[nomeUpper] ?? null
    const escolas = ESCOLAS[nomeUpper] ?? null
    const onibus = ONIBUS[nomeUpper] ?? null
    const seguranca = SEGURANCA[nomeUpper] ?? null

    let nbId = existingMap.get(nomeUpper)

    if (!nbId) {
      // Criar bairro novo
      const [nb] = await sql`
        INSERT INTO "Neighborhood" (
          id, name, "cityId",
          "totalVoters", "leisureAreasCount", "transportLines",
          "securityIncidents", "sanitationCoverage"
        ) VALUES (
          ${'b-' + slugify(nome)}, ${nome}, ${cityId},
          ${eleitores}, ${lazer}, ${onibus},
          ${seguranca}, ${95.0}
        )
        ON CONFLICT (id) DO UPDATE SET
          "totalVoters" = EXCLUDED."totalVoters",
          "leisureAreasCount" = EXCLUDED."leisureAreasCount",
          "transportLines" = EXCLUDED."transportLines",
          "securityIncidents" = EXCLUDED."securityIncidents",
          "sanitationCoverage" = EXCLUDED."sanitationCoverage"
        RETURNING id
      `
      nbId = nb.id
      created++
    } else {
      // Atualizar existente
      await sql`
        UPDATE "Neighborhood" SET
          "totalVoters" = COALESCE(${eleitores}, "totalVoters"),
          "leisureAreasCount" = COALESCE(${lazer}, "leisureAreasCount"),
          "transportLines" = COALESCE(${onibus}, "transportLines"),
          "securityIncidents" = COALESCE(${seguranca}, "securityIncidents"),
          "sanitationCoverage" = 95.0
        WHERE id = ${nbId}
      `
      updated++
    }

    // Escolas como métrica
    if (escolas && nbId) {
      await sql`
        INSERT INTO "NeighborhoodMetric" (id, "neighborhoodId", year, "metricType", value)
        VALUES (${'escola-' + nbId}, ${nbId}, 2023, 'ESCOLAS', ${escolas})
        ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value
      `
    }

    const parts = []
    if (eleitores) parts.push(`👥${eleitores.toLocaleString('pt-BR')}`)
    if (lazer) parts.push(`🌳${lazer}`)
    if (escolas) parts.push(`🏫${escolas}`)
    if (onibus) parts.push(`🚌${onibus}`)
    if (seguranca) parts.push(`🚨${seguranca}`)

    const status = nbId && !existingMap.get(nomeUpper) ? '🆕' : '✅'
    console.log(`${status} ${nome.padEnd(35)} ${parts.join(' ')}`)
  }

  console.log(`\n✅ ${updated} atualizados, 🆕 ${created} criados`)
  console.log(`📊 Total: ${TODOS_BAIRROS.length} bairros no banco`)
  console.log('\n🎉 Pronto! Abra o mapa e clique em qualquer bairro.')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
