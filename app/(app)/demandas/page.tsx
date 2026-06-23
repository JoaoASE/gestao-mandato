'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter, Search, ExternalLink, MessageCircle, MapPin, Clock, CheckCircle2, AlertCircle, Loader2, ChevronDown, Copy } from 'lucide-react'

const CATEGORIAS = ['Todas', 'Infraestrutura', 'Iluminação', 'Limpeza', 'Segurança', 'Saúde', 'Transporte', 'Educação', 'Geral']
const STATUS_OPTS = ['Todos', 'PENDENTE', 'EM ANDAMENTO', 'RESOLVIDO']
const STATUS_STYLE: Record<string, string> = {
  'PENDENTE': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'EM ANDAMENTO': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'RESOLVIDO': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}
const CAT_EMOJI: Record<string, string> = {
  'Infraestrutura': '🕳️', 'Iluminação': '💡', 'Limpeza': '🌿',
  'Segurança': '🚨', 'Saúde': '🏥', 'Transporte': '🚌',
  'Educação': '📚', 'Geral': '📋',
}

export default function DemandasPage() {
  const router = useRouter()
  const [demandas, setDemandas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/demandas')
      .then(r => r.json())
      .then(d => { setDemandas(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp`
    : '/api/whatsapp'

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = demandas.filter(d => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'Todas' || d.category === catFilter
    const matchStatus = statusFilter === 'Todos' || d.status === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  const stats = {
    total: demandas.length,
    pendente: demandas.filter(d => d.status === 'PENDENTE').length,
    andamento: demandas.filter(d => d.status === 'EM ANDAMENTO').length,
    resolvido: demandas.filter(d => d.status === 'RESOLVIDO').length,
  }

  async function updateStatus(id: string, status: string) {
    setDemandas(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    await fetch(`/api/demandas?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {})
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-base font-semibold text-slate-200">Central de Demandas</h1>
            <p className="text-xs text-slate-600 mt-0.5">Solicitações dos cidadãos via campo e WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhatsApp(!showWhatsApp)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-600/25 transition-all"
            >
              <MessageCircle size={14} />
              Integrar WhatsApp
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-300' },
            { label: 'Pendentes', value: stats.pendente, color: 'text-amber-400' },
            { label: 'Em andamento', value: stats.andamento, color: 'text-blue-400' },
            { label: 'Resolvidas', value: stats.resolvido, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Setup Panel */}
      {showWhatsApp && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Configurar WhatsApp via N8n + Evolution API</span>
            </div>
            <button onClick={() => setShowWhatsApp(false)} className="text-slate-600 hover:text-slate-400 text-xs">fechar</button>
          </div>
          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-slate-300 font-medium">Instalar Evolution API (gratuito)</p>
                <p className="mt-0.5">No seu VPS ou PC: <code className="bg-white/[0.05] px-1.5 py-0.5 rounded text-emerald-300">docker run -d -p 8080:8080 atendai/evolution-api</code></p>
                <a href="https://doc.evolution-api.com" target="_blank" className="text-emerald-400 hover:underline flex items-center gap-1 mt-1">doc.evolution-api.com <ExternalLink size={10} /></a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-slate-300 font-medium">Instalar N8n (gratuito)</p>
                <p className="mt-0.5"><code className="bg-white/[0.05] px-1.5 py-0.5 rounded text-emerald-300">docker run -d -p 5678:5678 n8nio/n8n</code> — acesse em <code className="text-emerald-300">localhost:5678</code></p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-slate-300 font-medium">No N8n: criar workflow</p>
                <p className="mt-0.5">Webhook trigger → detectar bairro e tipo → HTTP Request para:</p>
                <div className="flex items-center gap-2 mt-1 bg-white/[0.04] rounded-lg px-3 py-1.5">
                  <code className="text-emerald-300 flex-1 truncate text-[11px]">{webhookUrl}</code>
                  <button onClick={copyUrl} className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0">
                    {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
              <div>
                <p className="text-slate-300 font-medium">Adicionar no .env do Oráculo:</p>
                <code className="block bg-white/[0.04] rounded-lg px-3 py-1.5 mt-1 text-emerald-300 text-[11px]">
                  ZAPI_INSTANCE_ID=seu_id{'\n'}ZAPI_TOKEN=seu_token
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="px-6 py-3 border-b border-white/[0.04] shrink-0 space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar demanda..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-purple-500/30 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${statusFilter === s ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'text-slate-600 border-white/[0.06] hover:text-slate-400'}`}>
              {s}
            </button>
          ))}
          <div className="w-px bg-white/[0.06] mx-1" />
          {CATEGORIAS.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${catFilter === c ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'text-slate-600 border-white/[0.06] hover:text-slate-400'}`}>
              {c !== 'Todas' ? CAT_EMOJI[c] + ' ' : ''}{c}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-600">
            <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm text-slate-500">Nenhuma demanda encontrada</p>
            <p className="text-xs text-slate-700 mt-1">Ajuste os filtros ou aguarde mensagens via WhatsApp</p>
          </div>
        )}

        {filtered.map(d => (
          <div key={d.id} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-purple-500/10 rounded-2xl p-4 transition-all">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{CAT_EMOJI[d.category] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-200">{d.title || 'Demanda registrada'}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[d.status] || STATUS_STYLE['PENDENTE']}`}>
                    {d.status || 'PENDENTE'}
                  </span>
                </div>
                {d.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-slate-600">
                    <MapPin size={10} /> {d.neighborhoodId || 'Bairro não identificado'}
                  </span>
                  {d.createdAt && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock size={10} /> {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {d.description?.includes('WhatsApp') && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                      <MessageCircle size={10} /> WhatsApp
                    </span>
                  )}
                </div>
              </div>
              {/* Ações rápidas */}
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {d.status !== 'EM ANDAMENTO' && (
                  <button onClick={() => updateStatus(d.id, 'EM ANDAMENTO')}
                    className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
                    Iniciar
                  </button>
                )}
                {d.status !== 'RESOLVIDO' && (
                  <button onClick={() => updateStatus(d.id, 'RESOLVIDO')}
                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                    Resolver
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
