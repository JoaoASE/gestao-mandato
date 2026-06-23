import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'

const fmt = (v: number | null | undefined): number | null =>
  v !== undefined && v !== null && v !== 0 ? v : null

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const name = searchParams.get('name')

  if (!id && !name) {
    return NextResponse.json({ error: 'Missing ID or Name' }, { status: 400 })
  }

  try {
    let bairro: any = null

    try {
      if (id && id !== 'undefined') {
        bairro = await prisma.neighborhood.findUnique({
          where: { id },
          include: { CitizenDemand: true, HealthFacilities: true, Metrics: true },
        })
      } else if (name) {
        bairro = await prisma.neighborhood.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } },
          include: { CitizenDemand: true, HealthFacilities: true, Metrics: true },
        })
      }
    } catch (dbError) {
      console.warn('Banco inacessível:', dbError)
    }

    if (!bairro) {
      return NextResponse.json(
        { error: 'Bairro não encontrado' },
        { status: 404 }
      )
    }

    // Dados reais apenas — sem Math.random()
    const safeData = {
      id: bairro.id,
      name: bairro.name,
      totalVoters: fmt(bairro.totalVoters),
      averageIncome: fmt(bairro.averageIncome),
      leisureAreasCount: fmt(bairro.leisureAreasCount),
      securityIncidents: fmt(bairro.securityIncidents),
      sanitationCoverage: fmt(bairro.sanitationCoverage),
      transportLines: fmt(bairro.transportLines),
    }

    // Votos históricos reais do TSE
    let allVotes: any[] = []
    try {
      allVotes = await prisma.electoralResult.findMany({
        where: { neighborhoodId: bairro.id },
      })
    } catch (dbError) {
      console.warn('Votos indisponíveis:', dbError)
    }

    const allYears = Array.from(new Set(allVotes.map((r: any) => r.year))).sort(
      (a: any, b: any) => b - a
    )
    let historicoTop: any[] = []
    for (const year of allYears) {
      const votesOfYear = allVotes.filter((r: any) => r.year === year)
      votesOfYear.sort((a: any, b: any) => b.votesCount - a.votesCount)
      historicoTop.push(...votesOfYear.slice(0, 15))
    }

    // Praças e parques — leitura do CSV apenas como fallback temporário
    // TODO: migrar para tabela LeisureArea no banco (ver scripts/import-leisure.js)
    const normalizeString = (str: string) =>
      str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : ''
    const bName = normalizeString(bairro.name)

    let pracasReais: any[] = []
    let parquesReais: any[] = []

    try {
      const csvPath = path.join(process.cwd(), 'pracas.csv')
      if (fs.existsSync(csvPath)) {
        const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter(Boolean).slice(1)
        for (const line of lines) {
          const [praca, bairroCsv, rua, cep] = line.split(',')
          if (bairroCsv && normalizeString(bairroCsv).includes(bName)) {
            pracasReais.push({ praca: praca?.trim(), rua: rua?.trim(), cep: cep?.trim() })
          }
        }
      }
      const parquesCsvPath = path.join(process.cwd(), 'parques.csv')
      if (fs.existsSync(parquesCsvPath)) {
        const lines = fs.readFileSync(parquesCsvPath, 'utf-8').split('\n').filter(Boolean).slice(1)
        for (const line of lines) {
          const [parque, bairroCsv, rua, cep] = line.split(',')
          if (bairroCsv && normalizeString(bairroCsv).includes(bName)) {
            parquesReais.push({ parque: parque?.trim(), rua: rua?.trim(), cep: cep?.trim() })
          }
        }
      }
    } catch (e) {
      console.error('Erro ao ler CSVs de lazer:', e)
    }

    // Estatísticas eleitorais agregadas
    let eleitoralStats = null
    try {
      const statsPath = path.join(process.cwd(), 'public', 'bairros_eleitoral_stats.json')
      if (fs.existsSync(statsPath)) {
        const statsObj = JSON.parse(fs.readFileSync(statsPath, 'utf-8'))
        eleitoralStats = statsObj[bName] || null
      }
    } catch (e) {
      console.warn('Stats eleitorais indisponíveis')
    }

    // Demografia proporcional via Censo 2022
    let demographics = null
    try {
      const demoPath = path.join(process.cwd(), 'public', 'uberlandia_demographics.json')
      if (fs.existsSync(demoPath)) {
        const d = JSON.parse(fs.readFileSync(demoPath, 'utf-8'))
        const popVal = eleitoralStats?.aptos || bairro.totalVoters
        if (popVal) {
          demographics = {
            sexo: {
              homens: Math.round(popVal * d.sexo_percent.Homens),
              mulheres: Math.round(popVal * d.sexo_percent.Mulheres),
              homens_pct: (d.sexo_percent.Homens * 100).toFixed(1),
              mulheres_pct: (d.sexo_percent.Mulheres * 100).toFixed(1),
            },
            raca: {
              branca: Math.round(popVal * d.raca_percent.Branca),
              parda: Math.round(popVal * d.raca_percent.Parda),
              preta: Math.round(popVal * d.raca_percent.Preta),
              branca_pct: (d.raca_percent.Branca * 100).toFixed(1),
              parda_pct: (d.raca_percent.Parda * 100).toFixed(1),
              preta_pct: (d.raca_percent.Preta * 100).toFixed(1),
            },
          }
        }
      }
    } catch (e) {
      console.warn('Demographics indisponíveis')
    }

    // Instalações de saúde — sem simulação de fila aleatória
    const healthFacilities = (bairro.HealthFacilities || []).map((fac: any) => ({
      id: fac.id,
      name: fac.name,
      type: fac.type,
      latitude: fac.latitude,
      longitude: fac.longitude,
      currentQueueSize: fac.currentQueueSize ?? null,
      averageWaitTime: fac.averageWaitTime ?? null,
    }))

    return NextResponse.json({
      ...safeData,
      populacao: eleitoralStats?.aptos || safeData.totalVoters,
      eleitoralStats,
      demographics,
      rendaMedia: safeData.averageIncome,
      HealthFacilities: healthFacilities,
      historicoVotos: historicoTop,
      demandas: bairro.CitizenDemand || [],
      pracasReais,
      parquesReais,
    })
  } catch (error: any) {
    console.error('Erro em /api/bairro:', error)
    return NextResponse.json({ error: error.message || 'Erro desconhecido' }, { status: 500 })
  }
}
