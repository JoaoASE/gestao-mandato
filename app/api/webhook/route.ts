import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extraímos os dados
    const whatsapp = String(body.whatsapp || body.telefone || "");
    const { nome, titulo, descricao, categoria, bairro, latitude, longitude } = body;

    if (!whatsapp) {
      return NextResponse.json({ error: "WhatsApp é obrigatório" }, { status: 400 });
    }

    // 2. Busca o candidato dono do painel
    const candidato = await prisma.candidato.findFirst();
    if (!candidato) {
      return NextResponse.json({ error: "Candidato não encontrado." }, { status: 404 });
    }

    // 3. CRIA OU ATUALIZA O CIDADÃO
    const cidadao = await prisma.cidadao.upsert({
      where: { whatsapp },
      update: { 
        nome, 
        bairro: bairro || "Uberlândia" 
      },
      create: { 
        nome, 
        whatsapp, 
        bairro: bairro || "Uberlândia",
        candidatoId: candidato.id 
      }
    });

    // 4. CRIA A DEMANDA (Agora com o campo bairro incluso!)
    const novaDemanda = await prisma.demanda.create({
      data: {
        titulo: titulo || "Nova Demanda WhatsApp",
        descricao: descricao || "Sem descrição",
        categoria: categoria || "Geral",
        bairro: bairro || "Uberlândia", // <-- Isso resolve o erro!
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cidadaoId: cidadao.id,
        candidatoId: candidato.id
      }
    });

    console.log(`🚀 SUCESSO ABSOLUTO: Pin '${titulo}' gerado no mapa!`);

    return NextResponse.json({ 
      message: "Demanda registrada com sucesso!", 
      id: novaDemanda.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Erro detalhado no Webhook:", error);
    return NextResponse.json({ 
      error: "Erro ao processar dados", 
      detalhe: error.message 
    }, { status: 500 });
  }
}