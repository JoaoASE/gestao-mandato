/**
 * Webhook Z-API — recebe mensagens do WhatsApp e cria demandas automaticamente
 *
 * CONFIGURAÇÃO Z-API:
 * 1. Crie conta em https://z-api.io
 * 2. Conecte seu WhatsApp escaneando o QR code
 * 3. Em "Webhooks" → coloque: https://seu-dominio.vercel.app/api/whatsapp
 * 4. Adicione no .env:
 *    ZAPI_INSTANCE_ID=seu_instance_id
 *    ZAPI_TOKEN=seu_token
 *    ZAPI_CLIENT_TOKEN=seu_client_token
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Tipos de demanda reconhecidos automaticamente
const DEMAND_KEYWORDS: Record<string, { category: string; emoji: string }> = {
  // Infraestrutura
  'buraco': { category: 'Infraestrutura', emoji: '🕳️' },
  'asfalto': { category: 'Infraestrutura', emoji: '🛣️' },
  'calçada': { category: 'Infraestrutura', emoji: '🚶' },
  'calcada': { category: 'Infraestrutura', emoji: '🚶' },
  'obra': { category: 'Infraestrutura', emoji: '🔨' },
  'esgoto': { category: 'Infraestrutura', emoji: '🚰' },
  'água': { category: 'Infraestrutura', emoji: '💧' },
  'agua': { category: 'Infraestrutura', emoji: '💧' },
  'poço': { category: 'Infraestrutura', emoji: '💧' },
  // Iluminação
  'poste': { category: 'Iluminação', emoji: '💡' },
  'luz': { category: 'Iluminação', emoji: '💡' },
  'iluminação': { category: 'Iluminação', emoji: '💡' },
  'iluminacao': { category: 'Iluminação', emoji: '💡' },
  'lâmpada': { category: 'Iluminação', emoji: '💡' },
  // Limpeza
  'lixo': { category: 'Limpeza', emoji: '🗑️' },
  'entulho': { category: 'Limpeza', emoji: '🗑️' },
  'mato': { category: 'Limpeza', emoji: '🌿' },
  'capina': { category: 'Limpeza', emoji: '🌿' },
  'mato alto': { category: 'Limpeza', emoji: '🌿' },
  // Segurança
  'roubo': { category: 'Segurança', emoji: '🚨' },
  'assalto': { category: 'Segurança', emoji: '🚨' },
  'violência': { category: 'Segurança', emoji: '🚨' },
  'violencia': { category: 'Segurança', emoji: '🚨' },
  'droga': { category: 'Segurança', emoji: '🚨' },
  'tráfico': { category: 'Segurança', emoji: '🚨' },
  'trafico': { category: 'Segurança', emoji: '🚨' },
  // Saúde
  'ubs': { category: 'Saúde', emoji: '🏥' },
  'uai': { category: 'Saúde', emoji: '🏥' },
  'médico': { category: 'Saúde', emoji: '🏥' },
  'medico': { category: 'Saúde', emoji: '🏥' },
  'remédio': { category: 'Saúde', emoji: '💊' },
  'remedio': { category: 'Saúde', emoji: '💊' },
  'consulta': { category: 'Saúde', emoji: '🏥' },
  // Transporte
  'ônibus': { category: 'Transporte', emoji: '🚌' },
  'onibus': { category: 'Transporte', emoji: '🚌' },
  'ponto de ônibus': { category: 'Transporte', emoji: '🚌' },
  'transporte': { category: 'Transporte', emoji: '🚌' },
  // Educação
  'escola': { category: 'Educação', emoji: '📚' },
  'creche': { category: 'Educação', emoji: '👶' },
  'professor': { category: 'Educação', emoji: '📚' },
}

function detectCategory(text: string): { category: string; emoji: string } {
  const lower = text.toLowerCase()
  for (const [keyword, info] of Object.entries(DEMAND_KEYWORDS)) {
    if (lower.includes(keyword)) return info
  }
  return { category: 'Geral', emoji: '📋' }
}

function detectSentiment(text: string): string {
  const lower = text.toLowerCase()
  const negative = ['ruim', 'péssimo', 'horrível', 'urgente', 'perigoso', 'absurdo', 'vergonha', 'problema']
  const positive = ['obrigado', 'parabéns', 'ótimo', 'bom', 'melhorou']
  if (negative.some(w => lower.includes(w))) return 'Negativo'
  if (positive.some(w => lower.includes(w))) return 'Positivo'
  return 'Neutro'
}

async function sendWhatsAppReply(phone: string, message: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN
  if (!instanceId || !token) return

  await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken || '' },
    body: JSON.stringify({ phone, message }),
  }).catch(e => console.error('Erro ao responder WhatsApp:', e))
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    console.log('📱 Webhook Z-API recebido:', JSON.stringify(body).slice(0, 200))

    // Z-API envia diferentes tipos de evento — só processar mensagens de texto
    if (body.type !== 'ReceivedCallback') {
      return NextResponse.json({ ok: true, skipped: 'not a message' })
    }

    const phone = body.phone || body.from?.replace('@s.whatsapp.net', '')
    const text = body.text?.message || body.body || ''
    const senderName = body.senderName || body.pushName || 'Cidadão'

    if (!text || !phone) {
      return NextResponse.json({ ok: true, skipped: 'no text' })
    }

    // Ignorar mensagens de grupos
    if (body.isGroup || phone.includes('@g.us')) {
      return NextResponse.json({ ok: true, skipped: 'group message' })
    }

    // Buscar candidato (por ora o primeiro — em produção usar número do WhatsApp configurado)
    const candidate = await prisma.candidate.findFirst({
      include: { City: true }
    })
    if (!candidate) return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })

    // Detectar bairro na mensagem — busca por nome de bairro cadastrado
    const neighborhoods = await prisma.neighborhood.findMany({ where: { cityId: candidate.cityId } })
    let neighborhood = null
    const textLower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    for (const n of neighborhoods) {
      const nameLower = n.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (textLower.includes(nameLower)) {
        neighborhood = n
        break
      }
    }

    // Se não achou bairro, usa o primeiro como fallback e pede mais info
    const needsLocation = !neighborhood
    if (!neighborhood) {
      neighborhood = await prisma.neighborhood.findFirst({ where: { cityId: candidate.cityId } })
    }

    if (!neighborhood) return NextResponse.json({ error: 'Nenhum bairro encontrado' }, { status: 500 })

    // Detectar categoria e sentimento
    const { category, emoji } = detectCategory(text)
    const sentiment = detectSentiment(text)

    // Criar demanda no banco
    const demand = await prisma.citizenDemand.create({
      data: {
        id: `wa-${Date.now()}-${phone.slice(-4)}`,
        candidateId: candidate.id,
        neighborhoodId: neighborhood.id,
        title: `${emoji} ${category} — via WhatsApp`,
        description: `[WhatsApp | ${senderName} | ${phone}]\n\n${text}`,
        category,
        sentiment,
        latitude: 0,
        longitude: 0,
        status: 'PENDENTE',
      }
    })

    console.log(`✅ Demanda criada via WhatsApp: ${demand.id} | ${category} | ${neighborhood.name}`)

    // Responder automaticamente ao cidadão
    const replyMsg = needsLocation
      ? `Olá ${senderName}! ✅ Recebemos sua mensagem e abrimos uma demanda de *${category}*.\n\n📍 *Qual o bairro ou endereço exato?* Assim conseguimos encaminhar mais rapidamente!\n\n_Equipe ${candidate.name}_`
      : `Olá ${senderName}! ✅ Recebemos sua demanda de *${category}* no bairro *${neighborhood.name}*.\n\nVamos analisar e encaminhar para o setor responsável. Obrigado por colaborar! 🙏\n\n_Equipe ${candidate.name}_`

    await sendWhatsAppReply(phone, replyMsg)

    return NextResponse.json({ ok: true, demandId: demand.id, category, neighborhood: neighborhood.name })

  } catch (error: any) {
    console.error('Erro no webhook WhatsApp:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET para verificar se o webhook está ativo
export async function GET(): Promise<Response> {
  return NextResponse.json({
    status: 'ativo',
    descricao: 'Webhook WhatsApp Z-API — Oráculo Eleitoral',
    configuracao: {
      url_webhook: 'Configure esta URL no painel Z-API',
      variaveis_env: ['ZAPI_INSTANCE_ID', 'ZAPI_TOKEN', 'ZAPI_CLIENT_TOKEN'],
      documentacao: 'https://developer.z-api.io',
    }
  })
}
