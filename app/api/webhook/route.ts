import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    const { titulo, descricao, categoria, bairro, latitude, longitude } = body;

    // Busca o primeiro candidato (webhook externo não tem sessão)
    const candidate = await prisma.candidate.findFirst();
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
    }

    // Busca ou cria o bairro correspondente
    let neighborhood = await prisma.neighborhood.findFirst({
      where: { name: { contains: bairro || 'Uberlândia', mode: 'insensitive' } }
    });

    if (!neighborhood) {
      // Fallback: pega qualquer bairro da cidade do candidato
      neighborhood = await prisma.neighborhood.findFirst({
        where: { cityId: candidate.cityId }
      });
    }

    if (!neighborhood) {
      return NextResponse.json({ error: 'Bairro não encontrado.' }, { status: 404 });
    }

    const novaDemanda = await prisma.citizenDemand.create({
      data: {
        id: `webhook-${Date.now()}`,
        title: titulo || 'Nova Demanda WhatsApp',
        description: descricao || 'Sem descrição',
        category: categoria || 'Geral',
        sentiment: 'Neutro',
        status: 'PENDENTE',
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        candidateId: candidate.id,
        neighborhoodId: neighborhood.id,
      }
    });

    console.log(`Demanda webhook criada: ${novaDemanda.id}`);

    return NextResponse.json({
      message: 'Demanda registrada com sucesso!',
      id: novaDemanda.id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro no Webhook:', error);
    return NextResponse.json({
      error: 'Erro ao processar dados',
      detalhe: error.message
    }, { status: 500 });
  }
}
