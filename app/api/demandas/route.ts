import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentCandidate } from '@/lib/getCurrentCandidate'

export async function POST(request: Request) {
  try {
    const candidate = await getCurrentCandidate()
    const body = await request.json()
    const { neighborhoodId, description } = body

    if (!neighborhoodId || !description) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios' }, { status: 400 })
    }

    const newDemand = await prisma.citizenDemand.create({
      data: {
        id: `demand-${Date.now()}`,
        neighborhoodId,
        candidateId: candidate.id,
        title: 'Nova Demanda Relatada',
        description,
        category: 'Relato Diário',
        sentiment: 'Neutro',
        latitude: 0,
        longitude: 0,
        status: 'PENDENTE',
      },
    })

    return NextResponse.json(newDemand)
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('Erro em /api/demandas:', error)
    return NextResponse.json({ error: error.message || 'Erro desconhecido' }, { status: 500 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    const { status } = await request.json()
    const updated = await prisma.citizenDemand.update({ where: { id }, data: { status } })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
