import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // No novo banco não encontramos a tabela DadosDemograficos.
    // Usaremos a soma de eleitores por enquanto como fallback.
    const voters = await prisma.neighborhood.aggregate({
      _sum: { totalVoters: true }
    });

    return NextResponse.json({
      totalAnalfabetos: 0, // Placeholder
      totalEleitores: voters._sum.totalVoters || 0
    });
  } catch (error: any) {
    console.error("Erro em /api/demografia:", error);
    return NextResponse.json({ totalAnalfabetos: 0, error: "Tabela não encontrada no novo esquema" }, { status: 200 });
  }
}