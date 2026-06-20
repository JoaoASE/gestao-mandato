import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const bairro = await prisma.neighborhood.findUnique({
      where: { id },
      include: {
        CitizenDemand: true,
      }
    });

    if (!bairro) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Carrega apenas os votos deste bairro em específico (muito rápido)
    const allVotes = await prisma.electoralResult.findMany({
      where: { neighborhoodId: id }
    });

    // Agrupa e pega os top 15 de cada ano
    const allYears = Array.from(new Set(allVotes.map((r: any) => r.year))).sort((a: any, b: any) => b - a);
    let historicoTop = [];
    
    for (const year of allYears) {
      const votesOfYear = allVotes.filter((r: any) => r.year === year);
      votesOfYear.sort((a: any, b: any) => b.votesCount - a.votesCount);
      historicoTop.push(...votesOfYear.slice(0, 15));
    }

    return NextResponse.json({
      historicoVotos: historicoTop,
      demandas: bairro.CitizenDemand
    });
  } catch (error: any) {
    console.error("Erro em /api/bairro:", error);
    return NextResponse.json({ error: error.message || "Erro desconhecido" }, { status: 500 });
  }
}
