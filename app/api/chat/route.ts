import { streamText } from 'ai'
import { groq } from '@ai-sdk/groq'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
    }

    const { messages, data } = await req.json()
    const ctx = data?.context ?? {}

    // Buscar dados do candidato para enriquecer o contexto
    let candidateInfo = ''
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { clerkUserId: userId },
        include: { City: true }
      })
      if (candidate) {
        const demandCount = await prisma.citizenDemand.count({ where: { candidateId: candidate.id } })
        const pendingCount = await prisma.citizenDemand.count({ where: { candidateId: candidate.id, status: 'PENDENTE' } })
        candidateInfo = `
CANDIDATO: ${candidate.name}
CIDADE: ${candidate.City?.name || 'Uberlândia'} - MG
TOTAL DE DEMANDAS REGISTRADAS: ${demandCount}
DEMANDAS PENDENTES: ${pendingCount}
PLANO: ${(candidate as any).plan || 'candidato'}`
      }
    } catch (e) {}

    // ── SISTEMA DE PROMPT ENRIQUECIDO ─────────────────────────────────────────
    const systemPrompt = `Você é o ORÁCULO ELEITORAL — uma inteligência artificial consultora política de alto nível, especializada em eleições municipais brasileiras.

PERSONALIDADE:
- Analítico, direto e incisivo. Sem rodeios.
- Pensa como um estrategista de campanha experiente, não como um chatbot genérico.
- Usa dados reais para embasar cada recomendação.
- Quando não tem dado suficiente, diz claramente o que precisa saber.
- Nunca inventa números. Se um dado está ausente, aponta isso como lacuna estratégica.

MISSÃO:
Ajudar o candidato a vereador a maximizar votos em Uberlândia-MG nas eleições municipais.
Cada bairro é um território eleitoral distinto com perfil socioeconômico, histórico de votos e demandas específicas.

${candidateInfo ? `\n══ PERFIL DO CANDIDATO ══${candidateInfo}\n` : ''}

${ctx.bairro ? buildBairroContext(ctx) : buildCidadeContext(ctx)}

REGRAS DE RESPOSTA:
1. Sempre que analisar um bairro, siga este raciocínio: PERFIL → OPORTUNIDADE → AMEAÇA → AÇÃO.
2. Priorize ações de alto impacto e baixo custo (boca a boca, liderança comunitária, eventos em praças).
3. Para bairros de renda alta: foque em propostas de infraestrutura e segurança.
4. Para bairros de renda baixa/média: foque em saúde, transporte e emprego.
5. Para bairros com alta densidade eleitoral: foque em visibilidade e presença física.
6. Quando perguntado sobre estratégia geral: dê um plano de 3 prioridades com justificativa numérica.
7. Máximo 300 palavras por resposta, salvo quando pedir análise completa.`

    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
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

// ── Contexto completo de um bairro específico ─────────────────────────────────
function buildBairroContext(ctx: any): string {
  const votos2020 = ctx.historicoVotos?.filter((v: any) => v.year === 2020) || []
  const votos2022 = ctx.historicoVotos?.filter((v: any) => v.year === 2022) || []
  const totalVotos2020 = votos2020.reduce((s: number, v: any) => s + (v.votesCount || 0), 0)
  const totalVotos2022 = votos2022.reduce((s: number, v: any) => s + (v.votesCount || 0), 0)

  const topCandidatos2020 = votos2020
    .sort((a: any, b: any) => b.votesCount - a.votesCount)
    .slice(0, 5)
    .map((v: any) => `    ${v.candidateName}: ${v.votesCount} votos`)
    .join('\n') || '    Dados não disponíveis'

  const demandas = ctx.demandas || []
  const demandasPorCategoria: Record<string, number> = {}
  demandas.forEach((d: any) => {
    demandasPorCategoria[d.category] = (demandasPorCategoria[d.category] || 0) + 1
  })
  const demandasStr = Object.entries(demandasPorCategoria)
    .map(([cat, n]) => `    ${cat}: ${n} ocorrência(s)`)
    .join('\n') || '    Nenhuma demanda registrada ainda'

  const uais = ctx.healthFacilities?.filter((f: any) => f.type === 'UAI' || f.type === 'UPA') || []
  const ubs = ctx.healthFacilities?.filter((f: any) => f.type === 'UBS') || []

  const pracas = ctx.pracasReais || []
  const parques = ctx.parquesReais || []

  const demo = ctx.demographics
  const sexoStr = demo?.sexo
    ? `Homens: ${demo.sexo.homens_pct}% | Mulheres: ${demo.sexo.mulheres_pct}%`
    : 'Não disponível'
  const racaStr = demo?.raca
    ? `Branca: ${demo.raca.branca_pct}% | Parda: ${demo.raca.parda_pct}% | Preta: ${demo.raca.preta_pct}%`
    : 'Não disponível'

  const eleitoral = ctx.eleitoralStats || {}

  return `══ ANÁLISE TERRITORIAL: ${(ctx.bairro || '').toUpperCase()} ══

▸ DADOS ELEITORAIS
  Eleitores aptos: ${eleitoral.aptos?.toLocaleString('pt-BR') || ctx.populacao?.toLocaleString('pt-BR') || 'Não disponível'}
  Total de votos válidos 2020: ${totalVotos2020.toLocaleString('pt-BR') || 'Não disponível'}
  Total de votos válidos 2022: ${totalVotos2022.toLocaleString('pt-BR') || 'Não disponível'}
  Abstenção estimada: ${eleitoral.abstencao_pct ? eleitoral.abstencao_pct + '%' : 'Não calculada'}

▸ TOP 5 CANDIDATOS 2020 (VEREANÇA)
${topCandidatos2020}

▸ PERFIL SOCIOECONÔMICO
  Renda média domiciliar: ${ctx.rendaMedia ? 'R$ ' + Number(ctx.rendaMedia).toLocaleString('pt-BR') : 'Não disponível'}
  Cobertura de saneamento: ${ctx.sanitationCoverage ? ctx.sanitationCoverage + '%' : 'Não disponível'}
  Linhas de ônibus: ${ctx.transportLines ?? 'Não disponível'}
  Áreas de lazer: ${ctx.leisureAreasCount ?? 'Não disponível'} (${pracas.length} praças, ${parques.length} parques)

▸ DEMOGRAFIA (Censo 2022 proporcional)
  Sexo: ${sexoStr}
  Raça: ${racaStr}

▸ SAÚDE
  UAI/UPA: ${uais.length > 0 ? uais.map((u: any) => u.name).join(', ') : 'Nenhuma unidade'}
  UBS: ${ubs.length > 0 ? ubs.map((u: any) => u.name).join(', ') : 'Nenhuma unidade'}
  ${uais[0]?.currentQueueSize != null ? `Fila atual UAI: ${uais[0].currentQueueSize} pessoas` : ''}

▸ SEGURANÇA
  Ocorrências registradas: ${ctx.securityIncidents ?? 'Não disponível'}

▸ DEMANDAS DOS CIDADÃOS (registradas no sistema)
${demandasStr}

Com base nesses dados, analise o potencial eleitoral deste bairro e sugira a estratégia mais eficaz.`
}

// ── Contexto geral da cidade quando nenhum bairro está selecionado ────────────
function buildCidadeContext(ctx: any): string {
  return `══ CONTEXTO: UBERLÂNDIA - MG ══

▸ DADOS GERAIS
  Município: Uberlândia - MG
  Código IBGE: 3170206
  Região: Triângulo Mineiro
  Eleitorado estimado: ~500.000 eleitores aptos
  Vagas na Câmara Municipal: 27 vereadores

▸ PERFIL POLÍTICO
  Cidade universitária (UFU) com forte classe média
  Alta concentração de servidores públicos e profissionais liberais
  Periferia com demandas intensas de saúde, transporte e segurança
  Centro expandido com bairros de renda alta (Morada da Colina, Gávea, Patrimônio)
  Bairros populares com maior densidade eleitoral (Santa Mônica, Luizote, Shopping Park)

▸ ESTRATÉGIA GERAL RECOMENDADA
  Para vencer uma vaga de vereador em Uberlândia, o candidato precisa de ~8.000 a 12.000 votos.
  A estratégia territorial é fundamental: concentrar presença em 5-8 bairros-alvo é mais eficaz que dispersar esforços.

▸ COMO USAR O ORÁCULO
  - Clique em um bairro no mapa para análise territorial completa
  - Pergunte: "Qual bairro devo priorizar?"
  - Pergunte: "Como aumentar votos no Santa Mônica?"
  - Pergunte: "Quais são as principais demandas da periferia?"
  - Pergunte: "Monte um plano de campanha para os próximos 30 dias"

O Oráculo está pronto. Qual é sua primeira pergunta estratégica?`
}
