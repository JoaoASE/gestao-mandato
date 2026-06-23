import { streamText } from 'ai'
import { groq } from '@ai-sdk/groq'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Limites por plano (consultas por mês)
const PLAN_LIMITS: Record<string, number> = {
  candidato: 50,
  campanha: Infinity,
  partido: Infinity,
}

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
    }

    // Verificar limite de uso do plano
    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId: userId },
    })

    if (candidate) {
      const plan = (candidate as any).plan || 'candidato'
      const limit = PLAN_LIMITS[plan] ?? 50

      if (isFinite(limit)) {
        // Conta consultas do mês atual
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const usageCount = await prisma.citizenDemand.count({
          where: {
            candidateId: candidate.id,
            createdAt: { gte: startOfMonth },
          },
        })
        // Nota: em produção use uma tabela de Usage dedicada para contar chamadas IA
        // Por ora checamos apenas se já existe candidato — rate limiting completo na Fase 2
      }
    }

    const { messages, data } = await req.json()
    const context = data?.context

    let systemPrompt = `Você é o "Oráculo Eleitoral", uma IA consultora política de alto nível.
Sua personalidade é maquiavélica, pragmática e extremamente analítica.
Foque em estratégias de poder, conversão de votos e domínio territorial.
Responda de forma curta e incisiva.`

    if (context) {
      systemPrompt += `\n\n[DADOS DO TERRITÓRIO ATUAL]
Bairro: ${context.nome}
Renda Média: R$ ${context.rendaMedia ?? 'não disponível'}
Perfil de Votos: ${context.perfilVotacao ?? 'não disponível'}

Analise esses dados e dê sugestões agressivas para conquistar ou manter esse território.`
    }

    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      system: systemPrompt,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error('Erro no Oráculo:', error)
    return new Response(
      JSON.stringify({ error: 'O Oráculo está offline temporariamente.', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
