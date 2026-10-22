import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API que serve dados IBGE para o frontend.
 * Consolida métricas do banco com fallback para a API do IBGE em tempo real.
 */

const IBGE_CODE = '3170206'; // Uberlândia

async function fetchIBGE(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function extractIBGEValue(data: any): string | null {
  try {
    return data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.['2022'] || null;
  } catch { return null; }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'municipal';
  const neighborhoodId = searchParams.get('neighborhoodId');

  try {
    if (type === 'municipal') {
      // Tenta buscar do banco primeiro (importado via import_ibge.js)
      const metricas = await prisma.neighborhoodMetric.findMany({
        where: {
          source: 'IBGE_CENSO_2022',
          year: 2022,
        },
        distinct: ['metricType'],
        select: { metricType: true, value: true },
      });

      if (metricas.length > 0) {
        const obj: Record<string, number> = {};
        metricas.forEach(m => { obj[m.metricType] = m.value; });
        return NextResponse.json({ source: 'banco', data: obj });
      }

      // Fallback: busca direto na API do IBGE
      const [popData, rendaData, giniData] = await Promise.all([
        fetchIBGE(`https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${IBGE_CODE}]`),
        fetchIBGE(`https://servicodados.ibge.gov.br/api/v3/agregados/9891/periodos/2022/variaveis/10084?localidades=N6[${IBGE_CODE}]`),
        fetchIBGE(`https://servicodados.ibge.gov.br/api/v3/agregados/9891/periodos/2022/variaveis/10082?localidades=N6[${IBGE_CODE}]`),
      ]);

      return NextResponse.json({
        source: 'api_ibge',
        data: {
          POPULACAO_TOTAL: extractIBGEValue(popData),
          RENDA_MEDIA_MUNICIPAL: extractIBGEValue(rendaData),
          GINI_MUNICIPAL: extractIBGEValue(giniData),
        }
      });
    }

    if (type === 'bairro' && neighborhoodId) {
      const metricas = await prisma.neighborhoodMetric.findMany({
        where: { neighborhoodId, year: 2022 },
        select: { metricType: true, value: true, source: true, month: true },
        orderBy: { metricType: 'asc' },
      });

      const obj: Record<string, any> = {};
      metricas.forEach(m => { obj[m.metricType] = m.value; });

      return NextResponse.json({ neighborhoodId, metrics: obj });
    }

    if (type === 'saude') {
      // Busca estabelecimentos de saúde reais do CNES
      const facilities = await prisma.healthFacility.findMany({
        include: { Neighborhood: { select: { name: true } } },
        orderBy: { type: 'asc' },
      });

      // Agrupa por tipo
      const porTipo = facilities.reduce((acc: any, f) => {
        if (!acc[f.type]) acc[f.type] = [];
        acc[f.type].push({
          id: f.id,
          name: f.name,
          bairro: f.Neighborhood.name,
          latitude: f.latitude,
          longitude: f.longitude,
          address: f.address,
          currentQueueSize: f.currentQueueSize,
          averageWaitTime: f.averageWaitTime,
        });
        return acc;
      }, {});

      return NextResponse.json({
        total: facilities.length,
        porTipo,
        facilities,
      });
    }

    if (type === 'comparativo') {
      // Ranking de bairros por indicadores IBGE
      const bairros = await prisma.neighborhood.findMany({
        include: {
          Metrics: {
            where: { source: 'IBGE_CENSO_2022', year: 2022 },
            select: { metricType: true, value: true },
          }
        }
      });

      const ranking = bairros.map(b => {
        const metricas: Record<string, number> = {};
        b.Metrics.forEach(m => { metricas[m.metricType] = m.value; });

        // Score de vulnerabilidade (0–100, maior = mais vulnerável)
        const rendaScore = Math.max(0, 100 - ((b.averageIncome || 0) / 200));
        const segScore = Math.min(100, (b.securityIncidents || 0) / 2);
        const sanScore = Math.max(0, 100 - (b.sanitationCoverage || 100));
        const vulnerabilidade = Math.round((rendaScore + segScore + sanScore) / 3);

        return {
          id: b.id,
          nome: b.name,
          eleitores: b.totalVoters,
          rendaMedia: b.averageIncome,
          seguranca: b.securityIncidents,
          saneamento: b.sanitationCoverage,
          vulnerabilidade,
          metricasIBGE: metricas,
        };
      }).sort((a, b) => b.vulnerabilidade - a.vulnerabilidade);

      return NextResponse.json(ranking);
    }

    return NextResponse.json({ error: 'Tipo inválido. Use: municipal, bairro, saude, comparativo' }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na API IBGE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
