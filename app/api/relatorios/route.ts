import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import csvParser from 'csv-parser'

export const dynamic = 'force-dynamic'

// Fontes disponíveis
const DB_SOURCES = ['candidatos', 'bairros', 'resultados_eleitorais', 'demandas', 'partidos', 'perfil_eleitorado']
const CSV_SOURCES = ['Candidatos Uberlandia.csv', 'Resultado Candidato por Secao Uberlandia.csv',
  'Perfil Eleitorado por Local Uberlandia.csv', 'Partidos Uberlandia.csv',
  'Detalhes Secao Eleitoral Uberlandia.csv', 'Detalhes Zona Eleitoral Uberlandia.csv',
  'Resultado Candidato por Zona Uberlandia.csv', 'CensoIBGE.csv']

async function readCSV(filename: string, limit = 200, page = 1, search = ''): Promise<{data: any[], total: number}> {
  const filePath = path.join(process.cwd(), filename)
  if (!fs.existsSync(filePath)) return { data: [], total: 0 }

  return new Promise((resolve) => {
    const all: any[] = []
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!search || Object.values(row).some((v: any) => String(v).toLowerCase().includes(search.toLowerCase()))) {
          all.push(row)
        }
      })
      .on('end', () => {
        const total = all.length
        const start = (page - 1) * limit
        resolve({ data: all.slice(start, start + limit), total })
      })
      .on('error', () => resolve({ data: [], total: 0 }))
  })
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source') || 'candidatos'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')
  const search = searchParams.get('search') || ''
  const ano = searchParams.get('ano') || ''

  try {
    // ── CANDIDATOS ────────────────────────────────────────────────────────────
    if (source === 'candidatos') {
      // Tenta banco primeiro, fallback para CSV
      const csvResult = await readCSV('Candidatos Uberlandia.csv', limit, page, search)
      if (csvResult.total > 0) {
        const filtered = ano ? csvResult.data.filter(r => r.ano === ano) : csvResult.data
        return NextResponse.json({
          data: filtered,
          total: filtered.length,
          totalPages: Math.ceil(csvResult.total / limit),
          page,
          source: 'TSE',
          columns: filtered[0] ? Object.keys(filtered[0]) : [],
        })
      }

      // Fallback banco
      const where: any = {}
      if (search) where.name = { contains: search, mode: 'insensitive' }
      const [candidates, total] = await Promise.all([
        prisma.candidate.findMany({ where, take: limit, skip: (page - 1) * limit, include: { City: true } }),
        prisma.candidate.count({ where })
      ])
      const data = candidates.map((c: any) => ({
        nome: c.name, cidade: c.City?.name, slug: c.slug, plano: (c as any).plan
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'banco', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── BAIRROS ───────────────────────────────────────────────────────────────
    if (source === 'bairros') {
      const where: any = { cityId: 'city-udi-01' }
      if (search) where.name = { contains: search, mode: 'insensitive' }
      const [neighborhoods, total] = await Promise.all([
        prisma.neighborhood.findMany({
          where, take: limit, skip: (page - 1) * limit,
          orderBy: { name: 'asc' },
          include: { Metrics: { where: { metricType: 'ESCOLAS' } } }
        }),
        prisma.neighborhood.count({ where })
      ])
      const data = neighborhoods.map((n: any) => ({
        bairro: n.name,
        eleitores: n.totalVoters?.toLocaleString('pt-BR') ?? '—',
        renda_media: n.averageIncome ? `R$ ${Number(n.averageIncome).toLocaleString('pt-BR')}` : '—',
        areas_lazer: n.leisureAreasCount ?? '—',
        escolas: n.Metrics[0]?.value ?? '—',
        linhas_onibus: n.transportLines ?? '—',
        ocorrencias_ano: n.securityIncidents ?? '—',
        saneamento: n.sanitationCoverage ? `${n.sanitationCoverage}%` : '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'banco', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── RESULTADOS ELEITORAIS ─────────────────────────────────────────────────
    if (source === 'resultados_eleitorais') {
      const csvResult = await readCSV('Resultado Candidato por Secao Uberlandia.csv', limit, page, search)
      if (csvResult.total > 0) {
        const filtered = ano ? csvResult.data.filter(r => r.ano === ano) : csvResult.data
        return NextResponse.json({
          data: filtered, total: csvResult.total,
          totalPages: Math.ceil(csvResult.total / limit), page, source: 'TSE',
          columns: filtered[0] ? Object.keys(filtered[0]) : [],
        })
      }
      // Fallback banco
      const where: any = {}
      if (search) where.candidateName = { contains: search, mode: 'insensitive' }
      if (ano) where.year = parseInt(ano)
      const [results, total] = await Promise.all([
        prisma.electoralResult.findMany({
          where, take: limit, skip: (page - 1) * limit,
          orderBy: { votesCount: 'desc' },
          include: { Neighborhood: { select: { name: true } } }
        }),
        prisma.electoralResult.count({ where })
      ])
      const data = results.map((r: any) => ({
        ano: r.year, candidato: r.candidateName, bairro: r.Neighborhood?.name, votos: r.votesCount
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'banco', columns: ['ano','candidato','bairro','votos'] })
    }

    // ── DEMANDAS ──────────────────────────────────────────────────────────────
    if (source === 'demandas') {
      const where: any = {}
      if (search) where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
      const [demands, total] = await Promise.all([
        prisma.citizenDemand.findMany({
          where, take: limit, skip: (page - 1) * limit,
          orderBy: { createdAt: 'desc' },
          include: { Neighborhood: { select: { name: true } } }
        }),
        prisma.citizenDemand.count({ where })
      ])
      const data = demands.map((d: any) => ({
        bairro: d.Neighborhood?.name ?? '—',
        categoria: d.category,
        titulo: d.title,
        descricao: d.description?.slice(0, 120),
        status: d.status,
        sentimento: d.sentiment,
        data: d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'banco', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── PARTIDOS ──────────────────────────────────────────────────────────────
    if (source === 'partidos') {
      const csvResult = await readCSV('Partidos Uberlandia.csv', limit, page, search)
      return NextResponse.json({
        data: csvResult.data, total: csvResult.total,
        totalPages: Math.ceil(csvResult.total / limit), page, source: 'TSE',
        columns: csvResult.data[0] ? Object.keys(csvResult.data[0]) : [],
      })
    }

    // ── PERFIL ELEITORADO ─────────────────────────────────────────────────────
    if (source === 'perfil_eleitorado') {
      const csvResult = await readCSV('Perfil Eleitorado por Local Uberlandia.csv', limit, page, search)
      const filtered = ano ? { data: csvResult.data.filter(r => r.ano === ano), total: csvResult.total } : csvResult
      return NextResponse.json({
        data: filtered.data, total: filtered.total,
        totalPages: Math.ceil(filtered.total / limit), page, source: 'TSE',
        columns: filtered.data[0] ? Object.keys(filtered.data[0]) : [],
      })
    }

    return NextResponse.json({ error: 'Fonte inválida' }, { status: 400 })

  } catch (error: any) {
    console.error('Erro em /api/relatorios:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
