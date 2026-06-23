import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Busca apenas bairros e demandas, sem carregar milhares de linhas de candidatos na carga inicial
    const neighborhoods = await prisma.neighborhood.findMany({
      include: {
        CitizenDemand: true,
        HealthFacilities: true,
      }
    });

    const stats = neighborhoods.map((n: any) => ({
      id: n.id,
      nomeBairro: n.name,
      rendaMedia: n.averageIncome || 0,
      perfilVotacao: (n.totalVoters || 0) > 5000 ? "Base" : "Indeciso",
      populacao: n.totalVoters || 0,
      demandas: n.CitizenDemand,
      leisureAreasCount: n.leisureAreasCount,
      securityIncidents: n.securityIncidents,
      sanitationCoverage: n.sanitationCoverage,
      transportLines: n.transportLines,
      healthFacilities: n.HealthFacilities
    }));
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Erro em /api/estatisticas:", error);
    return NextResponse.json({ error: error.message || "Erro desconhecido" }, { status: 500 });
  }
}