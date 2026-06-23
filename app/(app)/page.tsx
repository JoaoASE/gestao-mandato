'use client'

import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/Logo'
import { useRouter } from 'next/navigation'
import {
  Map, BarChart3, FileText, TrendingUp, TrendingDown,
  AlertTriangle, ArrowRight, Activity
} from 'lucide-react'

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KpiCard({ icon: Icon, label, value, sub, trend, spark, color, delay }: any) {
  const isUp = trend >= 0
  return (
    <div className={`glass rounded-2xl p-4 md:p-5 fade-in-up-${delay} flex flex-col gap-3 hover:border-purple-500/20 transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[11px] text-slate-600">{sub}</span>
        <Sparkline data={spark} color={color} />
      </div>
    </div>
  )
}

function DemandItem({ bairro, tipo, status, time }: any) {
  const colors: any = {
    'PENDENTE': 'text-amber-400 bg-amber-400/10',
    'EM ANDAMENTO': 'text-blue-400 bg-blue-400/10',
    'RESOLVIDO': 'text-emerald-400 bg-emerald-400/10',
  }
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-all cursor-pointer">
      <div className="w-2 h-2 rounded-full bg-purple-500 pulse-slow shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 font-medium truncate">{tipo}</div>
        <div className="text-xs text-slate-500">{bairro} · {time}</div>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${colors[status]}`}>{status}</span>
    </div>
  )
}

function VoteBar({ bairro, votos, total, rank }: any) {
  const pct = Math.round((votos / total) * 100)
  const colors = ['from-violet-500 to-purple-600', 'from-purple-500 to-fuchsia-600', 'from-fuchsia-500 to-pink-600']
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-4 text-right">{rank}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-300 font-medium">{bairro}</span>
          <span className="text-xs text-slate-500">{votos.toLocaleString('pt-BR')} votos</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${colors[rank - 1] || colors[2]} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-xs font-bold text-purple-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [demandas, setDemandas] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/demandas').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDemandas(d.slice(0, 5))
    }).catch(() => {})
  }, [])

  const kpis = [
    { icon: Activity, label: 'Eleitores Mapeados', value: '142.8k', sub: 'Base eleitoral ativa', trend: 4.2, spark: [80,95,88,102,110,108,120,128,135,142], color: '#a78bfa', delay: 1 },
    { icon: FileText, label: 'Demandas Abertas', value: demandas.length || 18, sub: 'Nos últimos 30 dias', trend: -12, spark: [30,28,35,22,18,25,20,18,22,18], color: '#f59e0b', delay: 2 },
    { icon: BarChart3, label: 'Bairros Prioritários', value: '8', sub: 'Alta oportunidade', trend: 2.1, spark: [4,5,5,6,6,7,7,7,8,8], color: '#34d399', delay: 3 },
    { icon: Map, label: 'Índice de Influência', value: '73%', sub: 'Penetração territorial', trend: 6.8, spark: [55,58,60,62,65,67,68,70,72,73], color: '#f472b6', delay: 4 },
  ]

  const topBairros = [
    { bairro: 'Santa Mônica', votos: 4820, total: 14000 },
    { bairro: 'Martins', votos: 3940, total: 14000 },
    { bairro: 'Luizote de Freitas', votos: 3210, total: 14000 },
    { bairro: 'Shopping Park', votos: 2890, total: 14000 },
    { bairro: 'Jardim Karaíba', votos: 2340, total: 14000 },
  ]

  const recentDemandas = demandas.length > 0 ? demandas.map((d: any) => ({
    bairro: d.neighborhoodId || 'Centro',
    tipo: d.title || d.description?.slice(0, 40) || 'Demanda registrada',
    status: d.status || 'PENDENTE',
    time: 'Recente',
  })) : [
    { bairro: 'Santa Mônica', tipo: 'Falta de iluminação pública na Av. Rondon Pacheco', status: 'PENDENTE', time: '2h atrás' },
    { bairro: 'Martins', tipo: 'Buraco na Rua Goiás próx. ao mercado central', status: 'EM ANDAMENTO', time: '5h atrás' },
    { bairro: 'Luizote', tipo: 'Solicitação de novo ponto de ônibus linha 510', status: 'PENDENTE', time: '1d atrás' },
    { bairro: 'Shopping Park', tipo: 'Segurança no entorno da escola municipal', status: 'RESOLVIDO', time: '2d atrás' },
    { bairro: 'Fundinho', tipo: 'Manutenção da praça central do bairro', status: 'EM ANDAMENTO', time: '3d atrás' },
  ]

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">

      {/* Alerta */}
      <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 border-l-2 border-amber-500/50 fade-in-up">
        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs text-slate-400">
          <span className="text-amber-400 font-semibold">Atenção:</span> Santa Mônica registrou aumento de 23% em ocorrências na última semana. Oráculo IA tem uma estratégia pronta.
        </p>
        <button className="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors shrink-0 flex items-center gap-1">
          Ver <ArrowRight size={12} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Demandas + Votos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="glass rounded-2xl p-4 md:p-5 fade-in-up-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Últimas Demandas</h2>
              <p className="text-xs text-slate-600">Relatos recentes dos bairros</p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {recentDemandas.map((d, i) => <DemandItem key={i} {...d} />)}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-5 fade-in-up-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Top Bairros — Votos</h2>
              <p className="text-xs text-slate-600">Resultado eleitoral 2020</p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
              Mapa <Map size={12} />
            </button>
          </div>
          <div className="space-y-4">
            {topBairros.map((b, i) => <VoteBar key={i} {...b} rank={i + 1} />)}
          </div>
        </div>
      </div>

      {/* CTA Mapa */}
      <button
        onClick={() => router.push('/dashboard')}
        className="w-full glass rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-center gap-4 hover:border-purple-500/30 hover:bg-purple-500/[0.03] transition-all duration-300 group border border-white/[0.04] fade-in-up-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/20 to-amber-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Map size={22} className="text-purple-400" />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-sm font-bold text-white mb-0.5">Abrir Mapa Eleitoral</div>
          <div className="text-xs text-slate-500">Visualize votos, demandas e indicadores por bairro em Uberlândia</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-purple-400 font-medium sm:ml-auto group-hover:gap-3 transition-all">
          Acessar <ArrowRight size={14} />
        </div>
      </button>

    </main>
  )
}
