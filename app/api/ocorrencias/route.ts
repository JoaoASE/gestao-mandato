import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const neighborhoodId = searchParams.get('neighborhoodId')
  const cityId = searchParams.get('cityId')
  const year = searchParams.get('year')
  const months = parseInt(searchParams.get('months') || '12') // últimos N meses

  if (!neighborhoodId && !cityId) {
    return NextResponse.json({ error: 'neighborhoodId ou cityId obrigatório' }, { status: 400 })
  }

  try {
    // Calcular período
    const now = new Date()
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1)
    const cutoffYear = cutoffDate.getFullYear()
    const cutoffMonth = cutoffDate.getMonth() + 1

    const where: any = {}
    if (neighborhoodId) where.neighborhoodId = neighborhoodId
    if (cityId) where.cityId = cityId
    if (year) {
      where.year = parseInt(year)
    } else {
      // Filtrar pelos últimos N meses
      where.OR = [
        { year: { gt: cutoffYear } },
        { year: cutoffYear, month: { gte: cutoffMonth } },
      ]
    }

    const occurrences = await prisma.crimeOccurrence.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    // Agregar por tipo de crime (total)
    const byType: Record<string, number> = {}
    const byMonth: Record<string, Record<string, number>> = {}

    for (const o of occurrences) {
      // Total por tipo
      byType[o.crimeType] = (byType[o.crimeType] || 0) + o.count

      // Série temporal por mês
      const key = `${o.year}-${String(o.month).padStart(2, '0')}`
      if (!byMonth[key]) byMonth[key] = {}
      byMonth[key][o.crimeType] = (byMonth[key][o.crimeType] || 0) + o.count
    }

    // Ordenar série temporal
    const timeSeries = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, crimes]) => ({
        period,
        label: formatPeriod(period),
        total: Object.values(crimes).reduce((s, v) => s + v, 0),
        ...crimes,
      }))

    const totalAll = Object.values(byType).reduce((s, v) => s + v, 0)

    // Ranking de bairros mais violentos (se consultando por cidade)
    let rankingBairros: any[] = []
    if (cityId && !neighborhoodId) {
      const ranking = await prisma.crimeOccurrence.groupBy({
        by: ['neighborhoodId'],
        where,
        _sum: { count: true },
        orderBy: { _sum: { count: 'desc' } },
        take: 10,
      })

      const neighborhoodIds = ranking.map((r: any) => r.neighborhoodId)
      const neighborhoods = await prisma.neighborhood.findMany({
        where: { id: { in: neighborhoodIds } },
        select: { id: true, name: true },
      })
      const nbMap = new Map(neighborhoods.map((n: any) => [n.id, n.name]))

      rankingBairros = ranking.map((r: any) => ({
        neighborhoodId: r.neighborhoodId,
        name: nbMap.get(r.neighborhoodId) || 'Desconhecido',
        total: r._sum.count || 0,
      }))
    }

    return NextResponse.json({
      total: totalAll,
      byType,
      timeSeries,
      rankingBairros,
      period: { months, cutoffYear, cutoffMonth },
      source: 'SSP-MG',
      lastUpdated: occurrences[0]
        ? `${occurrences[0].year}/${String(occurrences[0].month).padStart(2, '0')}`
        : null,
    })
  } catch (error: any) {
    console.error('Erro em /api/ocorrencias:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(month) - 1]}/${year}`
}
