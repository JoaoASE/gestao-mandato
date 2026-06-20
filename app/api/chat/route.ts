import { streamText } from 'ai';

import { groq } from '@ai-sdk/groq';



// Garante que a resposta seja gerada em tempo real e não fique em cache

export const dynamic = 'force-dynamic';



export async function POST(req: Request) {

  try {

    const { messages, data } = await req.json();

   

    // Captura o contexto do bairro enviado pelo frontend (via append)

    const context = data?.context;



    let systemPrompt = `Você é o "Oráculo Eleitoral", uma IA consultora política de alto nível.

Sua personalidade é maquiavélica, pragmática e extremamente analítica.

Foque em estratégias de poder, conversão de votos e domínio territorial.

Responda de forma curta e incisiva.`;

   

    // Se houver um bairro selecionado no mapa, injetamos no cérebro da IA

    if (context) {

      systemPrompt += `\n\n[DADOS DO TERRITÓRIO ATUAL]

Bairro: ${context.nome}

Renda Média: R$ ${context.rendaMedia}

Perfil de Votos: ${context.perfilVotacao}



Analise esses dados e dê sugestões agressivas para conquistar ou manter esse território.`;

    }



    const result = await streamText({

      // Usamos 'gemini-1.5-flash-latest' para garantir que a API v1beta encontre o modelo

      // Mudamos para Groq para respostas rápidas e sem limite rígido
      model: groq('llama-3.1-8b-instant'),

      system: systemPrompt,

      messages,

    });



    // Usa text stream para facilitar o parse no frontend sem depender de protocolos internos
    return result.toTextStreamResponse();



  } catch (error: any) {

    console.error('❌ Erro no Oráculo:', error);

   

    return new Response(

      JSON.stringify({

        error: 'O Oráculo está offline temporariamente.',

        details: error.message

      }),

      {

        status: 500,

        headers: { 'Content-Type': 'application/json' },

      }

    );

  }

}

