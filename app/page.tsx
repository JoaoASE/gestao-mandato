'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Map, BarChart3, Users, FileText, Zap, ChevronRight,
  TrendingUp, TrendingDown, Shield, HeartPulse, Bus,
  AlertTriangle, Bell, LogOut, Menu, X, Bot,
  Activity, Star, ArrowRight
} from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'

// ── Mini sparkline SVG ────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, trend, spark, color, delay }: any) {
  const isUp = trend >= 0
  return (
    <div className={`glass rounded-2xl p-4 md:p-5 glow-purple fade-in-up-${delay} flex flex-col gap-3 hover:border-purple-500/20 transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ background: `${color}18` }}>
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

// ── Demand Item ───────────────────────────────────────────────────────────────
function DemandItem({ bairro, tipo, status, time }: any) {
  const colors: any = {
    'PENDENTE': 'text-amber-400 bg-amber-400/10',
    'EM ANDAMENTO': 'text-blue-400 bg-blue-400/10',
    'RESOLVIDO': 'text-emerald-400 bg-emerald-400/10',
  }
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-all cursor-pointer group">
      <div className="w-2 h-2 rounded-full bg-purple-500 pulse-slow shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 font-medium truncate">{tipo}</div>
        <div className="text-xs text-slate-500">{bairro} · {time}</div>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${colors[status]}`}>{status}</span>
    </div>
  )
}

// ── Vote Bar ──────────────────────────────────────────────────────────────────
function VoteBar({ bairro, votos, total, rank }: any) {
  const pct = Math.round((votos / total) * 100)
  const colors = ['from-violet-500 to-purple-600', 'from-purple-500 to-fuchsia-600', 'from-fuchsia-500 to-pink-600']
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-slate-600 w-4 text-right">{rank}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-300 font-medium">{bairro}</span>
          <span className="text-xs text-slate-500">{votos.toLocaleString('pt-BR')} votos</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${colors[rank-1] || colors[2]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-xs font-bold text-purple-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, badge, active, onClick, collapsed }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group relative
        ${active
          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
        }`}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium flex-1">{label}</span>}
      {!collapsed && badge && (
        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
      {collapsed && (
        <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
          {label}
        </span>
      )}
    </button>
  )
}

// ── Main Home Component ───────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('home')
  const [demandas, setDemandas] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/estatisticas').then(r => r.json()).then(d => setStats(d)).catch(() => {})
    fetch('/api/demandas').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDemandas(d.slice(0, 5))
    }).catch(() => {})
  }, [])

  const candidateName = user?.firstName || user?.fullName || 'Candidato'

  const kpis = [
    {
      icon: Users, label: 'Eleitores Mapeados', value: '142.8k',
      sub: 'Base eleitoral ativa', trend: 4.2,
      spark: [80, 95, 88, 102, 110, 108, 120, 128, 135, 142],
      color: '#a78bfa', delay: 1
    },
    {
      icon: FileText, label: 'Demandas Abertas', value: demandas.length || 18,
      sub: 'Nos últimos 30 dias', trend: -12,
      spark: [30, 28, 35, 22, 18, 25, 20, 18, 22, 18],
      color: '#f59e0b', delay: 2
    },
    {
      icon: BarChart3, label: 'Bairros Prioritários', value: '8',
      sub: 'Alta oportunidade de votos', trend: 2.1,
      spark: [4, 5, 5, 6, 6, 7, 7, 7, 8, 8],
      color: '#34d399', delay: 3
    },
    {
      icon: Zap, label: 'Índice de Influência', value: '73%',
      sub: 'Penetração territorial', trend: 6.8,
      spark: [55, 58, 60, 62, 65, 67, 68, 70, 72, 73],
      color: '#f472b6', delay: 4
    },
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

  const alerts = [
    { icon: AlertTriangle, text: 'Santa Mônica: aumento de 23% em ocorrências', color: 'text-amber-400' },
    { icon: HeartPulse, text: 'UAI Martins com fila acima da média', color: 'text-red-400' },
    { icon: Bus, text: 'Linha 510 sem horário noturno desde julho', color: 'text-blue-400' },
  ]

  return (
    <div className="flex h-screen w-full bg-[#050505] text-slate-200 overflow-hidden font-sans bg-grid">

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        ${sidebarCollapsed ? 'w-[64px]' : 'w-[240px]'}
        flex flex-col bg-[#080808] border-r border-white/[0.04] shrink-0
        transition-all duration-300 ease-in-out z-50
        fixed md:relative h-full
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="p-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shrink-0">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-sm text-gradient">Oráculo</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center mx-auto">
              <Zap size={14} className="text-white" />
            </div>
          )}
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="text-slate-600 hover:text-slate-400 transition-colors hidden md:block">
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Candidato */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {candidateName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">{candidateName}</div>
                <div className="text-[10px] text-slate-600">Candidato · Uberlândia</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!sidebarCollapsed && <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider px-3 mb-2">Principal</div>}
          <NavItem icon={Activity} label="Visão Geral" active={activeNav === 'home'} onClick={() => { setActiveNav('home'); setSidebarOpen(false) }} collapsed={sidebarCollapsed} />
          <NavItem icon={Map} label="Mapa Eleitoral" onClick={() => router.push('/dashboard')} collapsed={sidebarCollapsed} />
          <NavItem icon={FileText} label="Demandas" badge={demandas.length || '18'} onClick={() => router.push('/dashboard')} collapsed={sidebarCollapsed} />
          <NavItem icon={BarChart3} label="Previsões" onClick={() => router.push('/previsoes')} collapsed={sidebarCollapsed} />

          {!sidebarCollapsed && <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider px-3 mb-2 mt-4">Inteligência</div>}
          <NavItem icon={Bot} label="Oráculo IA" onClick={() => router.push('/dashboard')} collapsed={sidebarCollapsed} />
          <NavItem icon={Shield} label="Segurança" active={activeNav === 'seg'} onClick={() => setActiveNav('seg')} collapsed={sidebarCollapsed} />
          <NavItem icon={Star} label="Relatórios" onClick={() => router.push('/relatorios')} collapsed={sidebarCollapsed} />
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/[0.04] space-y-1 shrink-0">
          {sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(false)} className="w-full flex items-center justify-center p-2 text-slate-600 hover:text-slate-400 transition-colors">
              <ChevronRight size={16} className="rotate-180" />
            </button>
          )}
          <NavItem icon={LogOut} label="Sair" onClick={() => signOut(() => router.push('/login'))} collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 border-b border-white/[0.04] flex items-center justify-between px-4 md:px-6 shrink-0 bg-[#080808]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-500 hover:text-slate-300 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-200">Bom dia, {candidateName} 👋</h1>
              <p className="text-xs text-slate-600 hidden sm:block">Uberlândia · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all duration-200 glow-purple"
            >
              <Map size={14} />
              <span className="hidden sm:inline">Ver Mapa</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">

          {/* Alerta rápido */}
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 border-l-2 border-amber-500/50 fade-in-up">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs text-slate-400"><span className="text-amber-400 font-semibold">Atenção:</span> Santa Mônica registrou aumento de 23% em ocorrências na última semana. Oráculo IA tem uma estratégia pronta.</p>
            <button className="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors shrink-0 flex items-center gap-1">
              Ver <ArrowRight size={12} />
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
          </div>

          {/* Demandas + Votos por bairro */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

            {/* Últimas demandas */}
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

            {/* Votos por bairro */}
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
                {topBairros.map((b, i) => (
                  <VoteBar key={i} {...b} rank={i + 1} />
                ))}
              </div>
            </div>
          </div>

          {/* Alertas + Acesso rápido */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Alertas */}
            <div className="lg:col-span-1 glass rounded-2xl p-4 md:p-5 fade-in-up-2">
              <h2 className="text-sm font-semibold text-slate-200 mb-4">Alertas Territoriais</h2>
              <div className="space-y-3">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl">
                    <a.icon size={14} className={`${a.color} shrink-0 mt-0.5`} />
                    <p className="text-xs text-slate-400 leading-relaxed">{a.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Acesso rápido ao mapa */}
            <div className="lg:col-span-2 fade-in-up-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full h-full min-h-[140px] glass rounded-2xl p-5 md:p-8 flex flex-col items-center justify-center gap-4 hover:border-purple-500/30 hover:bg-purple-500/[0.03] transition-all duration-300 group border border-white/[0.04]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/20 to-amber-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Map size={24} className="text-purple-400" />
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-white mb-1">Abrir Mapa Eleitoral</div>
                  <div className="text-xs text-slate-500">Visualize votos, demandas e indicadores por bairro em Uberlândia</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-400 font-medium group-hover:gap-3 transition-all">
                  Acessar agora <ArrowRight size={14} />
                </div>
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
