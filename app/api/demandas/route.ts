import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { neighborhoodId, description } = body;

    if (!neighborhoodId || !description) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios' }, { status: 400 });
    }

    // Pega o primeiro candidato do banco como autor (mock para o usuário atual)
    const candidate = await prisma.candidate.findFirst();
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 400 });
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
        status: 'PENDENTE'
      }
    });

    return NextResponse.json(newDemand);
  } catch (error: any) {
    console.error("Erro em /api/demandas:", error);
    return NextResponse.json({ error: error.message || "Erro desconhecido" }, { status: 500 });
  }
}
