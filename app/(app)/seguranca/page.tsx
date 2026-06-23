'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Shield, Info } from 'lucide-react'

const CRIME_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ROUBO:     { label: 'Roubos',    color: '#f472b6', bg: 'bg-pink-500/10' },
  FURTO:     { label: 'Furtos',    color: '#60a5fa', bg: 'bg-blue-500/10' },
  HOMICIDIO: { label: 'Homicídios', color: '#f87171', bg: 'bg-red-500/10' },
  TRAFICO:   { label: 'Tráfico',   color: '#a78bfa', bg: 'bg-purple-500/10' },
  LESAO:     { label: 'Lesão corporal', color: '#fb923c', bg: 'bg-orange-500/10' },
  ESTUPRO:   { label: 'Violência sexual', color: '#f43f5e', bg: 'bg-rose-500/10' },
  OUTROS:    { label: 'Outros',    color: '#94a3b8', bg: 'bg-slate-500/10' },
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// Mini bar chart component
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// Inline SVG sparkline for trend
function TrendLine({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const w = 60, h = 20
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SegurancaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonths, setSelectedMonths] = useState(12)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ocorrencias?cityId=city-udi-01&months=${selectedMonths}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedMonths])

  const hasData = data && data.total > 0
  const timeSeries = data?.timeSeries || []
  const byType = data?.byType || {}

  // Calcular tendência (últimos 3 meses vs 3 meses anteriores)
  const trend = (() => {
    if (timeSeries.length < 6) return null
    const recent = timeSeries.slice(-3).reduce((s: number, m: any) => s + (m.total || 0), 0)
    const prior = timeSeries.slice(-6, -3).reduce((s: number, m: any) => s + (m.total || 0), 0)
    if (prior === 0) return null
    return Math.round(((recent - prior) / prior) * 100)
  })()

  const maxByType = Math.max(...Object.values(byType) as number[], 1)
  const maxMonthTotal = Math.max(...timeSeries.map((m: any) => m.total || 0), 1)

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-200">Painel de Segurança</h1>
            <p className="text-xs text-slate-600 mt-0.5">Uberlândia · Dados SSP-MG · Crimes violentos registrados</p>
          </div>
          <div className="flex gap-2">
            {[6, 12, 24].map(m => (
              <button key={m} onClick={() => setSelectedMonths(m)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${selectedMonths === m ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'text-slate-600 border-white/[0.06] hover:text-slate-400'}`}>
                {m === 24 ? '2 anos' : `${m} meses`}
              </button>
            ))}
          </div>
        </div>

        {/* Aviso sem dados */}
        {!loading && !hasData && (
          <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-2xl p-6 text-center">
            <AlertTriangle size={24} className="text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-amber-300 mb-1">Dados não importados ainda</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Para ativar este painel, baixe o CSV de crimes violentos da SSP-MG, filtre por Uberlândia e execute:
            </p>
            <code className="block mt-3 bg-white/[0.03] rounded-xl px-4 py-2 text-xs text-emerald-300 text-left max-w-sm mx-auto">
              node scripts/import-crimes.js
            </code>
            <a href="https://dados.mg.gov.br/dataset/crimes-violentos" target="_blank"
              className="inline-flex items-center gap-1 mt-3 text-xs text-purple-400 hover:underline">
              Baixar CSV da SSP-MG →
            </a>
          </div>
        )}

        {/* KPIs */}
        {hasData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass rounded-2xl p-4">
              <div className="text-2xl font-bold text-white">{data.total.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-slate-500 mt-1">Total de ocorrências</div>
              <div className="text-[11px] text-slate-600 mt-0.5">últimos {selectedMonths} meses</div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-2xl font-bold text-pink-400">{(byType.ROUBO || 0).toLocaleString('pt-BR')}</div>
              <div className="text-xs text-slate-500 mt-1">Roubos registrados</div>
              <TrendLine data={timeSeries.map((m: any) => m.ROUBO || 0)} color="#f472b6" />
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-400">{(byType.HOMICIDIO || 0).toLocaleString('pt-BR')}</div>
              <div className="text-xs text-slate-500 mt-1">Homicídios</div>
              <TrendLine data={timeSeries.map((m: any) => m.HOMICIDIO || 0)} color="#f87171" />
            </div>
            <div className={`glass rounded-2xl p-4 ${trend !== null ? (trend > 0 ? 'border-red-500/20' : 'border-emerald-500/20') : ''}`}>
              {trend !== null ? (
                <>
                  <div className={`text-2xl font-bold flex items-center gap-1 ${trend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {trend > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    {Math.abs(trend)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Tendência trimestral</div>
                  <div className={`text-[11px] mt-0.5 ${trend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {trend > 0 ? 'em alta' : 'em queda'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-500">—</div>
                  <div className="text-xs text-slate-600 mt-1">Tendência</div>
                  <div className="text-[11px] text-slate-700 mt-0.5">dados insuficientes</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Gráfico de barras mensal */}
        {hasData && timeSeries.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Evolução mensal — todos os crimes</h2>
            <div className="flex items-end gap-1 h-28">
              {timeSeries.map((m: any, i: number) => {
                const pct = (m.total / maxMonthTotal) * 100
                const isHigh = m.total > (data.total / timeSeries.length) * 1.2
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '88px' }}>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80 ${isHigh ? 'bg-red-500/40' : 'bg-purple-500/30'}`}
                        style={{ height: `${Math.max(pct * 0.88, 2)}%` }}
                      />
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                        {m.total}
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-700 truncate w-full text-center">{m.label?.split('/')[0]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Por tipo de crime */}
        {hasData && (
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Distribuição por tipo de crime</h2>
            <div className="space-y-3">
              {Object.entries(CRIME_LABELS).map(([type, info]) => {
                const count = byType[type] || 0
                if (count === 0) return null
                const pct = Math.round((count / data.total) * 100)
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{info.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{count.toLocaleString('pt-BR')}</span>
                        <span className="text-[10px] font-bold" style={{ color: info.color }}>{pct}%</span>
                      </div>
                    </div>
                    <MiniBar value={count} max={maxByType} color={info.color} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Fonte e nota */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <Info size={13} className="text-slate-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-500">Fonte:</strong> Secretaria de Segurança Pública de Minas Gerais (SSP-MG) via dados.mg.gov.br.
            Dados por município — granularidade por bairro requer pedido via LAI ao comando da 9ª RISP/9º BPM de Uberlândia.
            {data?.lastUpdated && <span> · Última atualização: {data.lastUpdated}</span>}
          </div>
        </div>

      </div>
    </div>
  )
}
