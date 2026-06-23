/**
 * Script de importação de praças e parques para o banco de dados.
 * Elimina a necessidade de ler CSV em runtime nas APIs.
 *
 * Uso: node scripts/import-leisure.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const normalizeString = (str) =>
  str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : ''

async function importLeisure() {
  console.log('🌳 Iniciando importação de praças e parques...')

  const neighborhoods = await prisma.neighborhood.findMany()
  const neighborhoodMap = new Map(
    neighborhoods.map((n) => [normalizeString(n.name), n.id])
  )

  let imported = 0
  let skipped = 0

  // Importar praças
  const pracasPath = path.join(process.cwd(), 'pracas.csv')
  if (fs.existsSync(pracasPath)) {
    const lines = fs.readFileSync(pracasPath, 'utf-8').split('\n').filter(Boolean).slice(1)
    for (const line of lines) {
      const [praca, bairro, rua] = line.split(',').map((s) => s?.trim())
      if (!praca || !bairro) continue

      const neighborhoodId =
        neighborhoodMap.get(normalizeString(bairro)) ||
        [...neighborhoodMap.entries()].find(([k]) => k.includes(normalizeString(bairro)))?.[1]

      if (!neighborhoodId) { skipped++; continue }

      await prisma.leisureArea.upsert({
        where: { id: `praca-${normalizeString(praca)}` },
        update: { name: praca, street: rua || null },
        create: {
          id: `praca-${normalizeString(praca)}`,
          name: praca,
          type: 'PRACA',
          street: rua || null,
          neighborhoodId,
        },
      })
      imported++
    }
    console.log(`✅ Praças: ${imported} importadas, ${skipped} sem bairro correspondente`)
  } else {
    console.warn('⚠ pracas.csv não encontrado')
  }

  // Importar parques
  imported = 0; skipped = 0
  const parquesPath = path.join(process.cwd(), 'parques.csv')
  if (fs.existsSync(parquesPath)) {
    const lines = fs.readFileSync(parquesPath, 'utf-8').split('\n').filter(Boolean).slice(1)
    for (const line of lines) {
      const [parque, bairro, rua] = line.split(',').map((s) => s?.trim())
      if (!parque || !bairro) continue

      const neighborhoodId =
        neighborhoodMap.get(normalizeString(bairro)) ||
        [...neighborhoodMap.entries()].find(([k]) => k.includes(normalizeString(bairro)))?.[1]

      if (!neighborhoodId) { skipped++; continue }

      await prisma.leisureArea.upsert({
        where: { id: `parque-${normalizeString(parque)}` },
        update: { name: parque, street: rua || null },
        create: {
          id: `parque-${normalizeString(parque)}`,
          name: parque,
          type: 'PARQUE',
          street: rua || null,
          neighborhoodId,
        },
      })
      imported++
    }
    console.log(`✅ Parques: ${imported} importados, ${skipped} sem bairro correspondente`)
  } else {
    console.warn('⚠ parques.csv não encontrado')
  }

  await prisma.$disconnect()
  console.log('🎉 Importação concluída. Pode remover a leitura de CSV das APIs.')
}

importLeisure().catch((e) => {
  console.error(e)
  process.exit(1)
})
