import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source') || 'candidatos'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')
  const search = searchParams.get('search') || ''
  const ano = searchParams.get('ano') || ''
  const skip = (page - 1) * limit

  try {
    // ── CANDIDATOS ────────────────────────────────────────────────────────────
    if (source === 'candidatos') {
      const where: any = {}
      if (ano) where.ano = parseInt(ano)
      if (search) where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { nomeUrna: { contains: search, mode: 'insensitive' } },
        { siglaPartido: { contains: search, mode: 'insensitive' } },
        { cargo: { contains: search, mode: 'insensitive' } },
        { ocupacao: { contains: search, mode: 'insensitive' } },
      ]
      const [rows, total] = await Promise.all([
        prisma.tseCandidato.findMany({ where, take: limit, skip, orderBy: [{ ano: 'desc' }, { nome: 'asc' }] }),
        prisma.tseCandidato.count({ where })
      ])
      const data = rows.map((r: any) => ({
        ano: r.ano, numero: r.numero, nome: r.nome, urna: r.nomeUrna,
        partido: r.siglaPartido, cargo: r.cargo, situacao: r.situacao,
        genero: r.genero ?? '—', idade: r.idade ?? '—',
        instrucao: r.instrucao ?? '—', raca: r.raca ?? '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'TSE', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── BAIRROS ───────────────────────────────────────────────────────────────
    if (source === 'bairros') {
      const where: any = {}
      if (search) where.name = { contains: search, mode: 'insensitive' }
      const [rows, total] = await Promise.all([
        prisma.neighborhood.findMany({
          where, take: limit, skip, orderBy: { name: 'asc' },
          include: { Metrics: { where: { metricType: 'ESCOLAS' } }, LeisureAreas: { select: { type: true } } }
        }),
        prisma.neighborhood.count({ where })
      ])
      const data = rows.map((n: any) => ({
        bairro: n.name,
        eleitores_2024: n.totalVoters?.toLocaleString('pt-BR') ?? '—',
        renda_media: n.averageIncome ? `R$ ${Number(n.averageIncome).toLocaleString('pt-BR')}` : '—',
        pracas_parques: n.LeisureAreas?.length ?? n.leisureAreasCount ?? '—',
        escolas: n.Metrics?.[0]?.value ?? '—',
        linhas_onibus: n.transportLines ?? '—',
        ocorrencias_ano: n.securityIncidents ?? '—',
        saneamento: n.sanitationCoverage ? `${n.sanitationCoverage}%` : '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'Banco', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── RESULTADOS POR SEÇÃO ──────────────────────────────────────────────────
    if (source === 'resultados_eleitorais') {
      const where: any = {}
      if (ano) where.ano = parseInt(ano)
      if (search) where.OR = [
        { numeroCandidato: { contains: search } },
        { siglaPartido: { contains: search, mode: 'insensitive' } },
        { cargo: { contains: search, mode: 'insensitive' } },
      ]
      const [rows, total] = await Promise.all([
        prisma.tseResultadoSecao.findMany({ where, take: limit, skip, orderBy: [{ ano: 'desc' }, { votos: 'desc' }] }),
        prisma.tseResultadoSecao.count({ where })
      ])
      const data = rows.map((r: any) => ({
        ano: r.ano, turno: r.turno, zona: r.zona, seção: r.secao,
        cargo: r.cargo, partido: r.siglaPartido,
        candidato: r.numeroCandidato, votos: r.votos.toLocaleString('pt-BR'),
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'TSE', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── DETALHES POR SEÇÃO ────────────────────────────────────────────────────
    if (source === 'detalhes_secao') {
      const where: any = {}
      if (ano) where.ano = parseInt(ano)
      if (search) where.OR = [{ zona: { contains: search } }, { cargo: { contains: search, mode: 'insensitive' } }]
      const [rows, total] = await Promise.all([
        prisma.tseDetalhesSecao.findMany({ where, take: limit, skip, orderBy: [{ ano: 'desc' }, { zona: 'asc' }] }),
        prisma.tseDetalhesSecao.count({ where })
      ])
      const data = rows.map((r: any) => ({
        ano: r.ano, turno: r.turno, zona: r.zona, seção: r.secao, cargo: r.cargo,
        aptos: r.aptos.toLocaleString('pt-BR'),
        comparecimento: r.comparecimento.toLocaleString('pt-BR'),
        abstencoes: r.abstencoes.toLocaleString('pt-BR'),
        votos_nominais: r.votosNominais.toLocaleString('pt-BR'),
        votos_brancos: r.votosBrancos.toLocaleString('pt-BR'),
        votos_nulos: r.votosNulos.toLocaleString('pt-BR'),
        comparecimento_pct: r.proporcaoComparecimento ? `${(r.proporcaoComparecimento * 100).toFixed(1)}%` : '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'TSE', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── PERFIL ELEITORADO ─────────────────────────────────────────────────────
    if (source === 'perfil_eleitorado') {
      const where: any = {}
      if (ano) where.ano = parseInt(ano)
      if (search) where.OR = [
        { bairro: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { endereco: { contains: search, mode: 'insensitive' } },
      ]
      const [rows, total] = await Promise.all([
        prisma.tsePerfilEleitorado.findMany({ where, take: limit, skip, orderBy: [{ ano: 'desc' }, { bairro: 'asc' }] }),
        prisma.tsePerfilEleitorado.count({ where })
      ])
      const data = rows.map((r: any) => ({
        ano: r.ano, zona: r.zona, seção: r.secao,
        local: r.nome, bairro: r.bairro ?? '—',
        endereço: r.endereco ?? '—',
        eleitores: r.eleitores.toLocaleString('pt-BR'),
        latitude: r.latitude ?? '—', longitude: r.longitude ?? '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'TSE', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── PARTIDOS ──────────────────────────────────────────────────────────────
    if (source === 'partidos') {
      const where: any = {}
      if (ano) where.ano = parseInt(ano)
      if (search) where.OR = [
        { sigla: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { nomeColigacao: { contains: search, mode: 'insensitive' } },
      ]
      const [rows, total] = await Promise.all([
        prisma.tsePartido.findMany({ where, take: limit, skip, orderBy: [{ ano: 'desc' }, { sigla: 'asc' }] }),
        prisma.tsePartido.count({ where })
      ])
      const data = rows.map((r: any) => ({
        ano: r.ano, sigla: r.sigla, nome: r.nome, cargo: r.cargo,
        situação: r.situacaoLegenda ?? '—', coligação: r.nomeColigacao ?? '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'TSE', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── DEMANDAS ──────────────────────────────────────────────────────────────
    if (source === 'demandas') {
      const where: any = {}
      if (search) where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
      ]
      const [rows, total] = await Promise.all([
        prisma.citizenDemand.findMany({
          where, take: limit, skip, orderBy: { createdAt: 'desc' },
          include: { Neighborhood: { select: { name: true } } }
        }),
        prisma.citizenDemand.count({ where })
      ])
      const data = rows.map((d: any) => ({
        bairro: d.Neighborhood?.name ?? '—', categoria: d.category,
        titulo: d.title, status: d.status, sentimento: d.sentiment,
        descrição: d.description?.slice(0, 100) ?? '—',
        data: d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : '—',
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'Banco', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    // ── POPULAÇÃO ─────────────────────────────────────────────────────────────
    if (source === 'populacao') {
      const where: any = {}
      if (search) where.OR = [
        { grupoIdade: { contains: search, mode: 'insensitive' } },
        { corRaca: { contains: search, mode: 'insensitive' } },
        { sexo: { contains: search, mode: 'insensitive' } },
      ]
      const [rows, total] = await Promise.all([
        prisma.populacaoMunicipio.findMany({ where, take: limit, skip, orderBy: [{ ano: 'desc' }, { grupoIdade: 'asc' }] }),
        prisma.populacaoMunicipio.count({ where })
      ])
      const data = rows.map((r: any) => ({
        ano: r.ano, grupo_idade: r.grupoIdade, sexo: r.sexo,
        cor_raca: r.corRaca, populacao: r.populacao.toLocaleString('pt-BR'),
      }))
      return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, source: 'IBGE', columns: data[0] ? Object.keys(data[0]) : [] })
    }

    return NextResponse.json({ error: 'Fonte inválida' }, { status: 400 })

  } catch (error: any) {
    console.error('[/api/relatorios]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
