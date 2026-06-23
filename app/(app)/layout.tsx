'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import {
  Zap, Activity, Map, FileText, BarChart3, Bot,
  Shield, Star, LogOut, ChevronRight, Bell, Menu, X
} from 'lucide-react'

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const candidateName = user?.firstName || user?.fullName || 'Candidato'

  const isDashboard = pathname?.includes('/dashboard')

  return (
    <div className="flex h-screen w-full bg-[#050505] text-slate-200 overflow-hidden font-sans bg-grid">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#080808] border border-white/[0.04] rounded-xl p-2 text-slate-400 hover:text-slate-200 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* SIDEBAR */}
      <aside className={`
        ${collapsed ? 'w-[64px]' : 'w-[240px]'}
        flex flex-col bg-[#080808] border-r border-white/[0.04] shrink-0
        transition-all duration-300 ease-in-out z-50
        fixed md:relative h-full
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="p-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shrink-0">
              <Zap size={14} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-sm bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent truncate">
                Oráculo
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 hidden md:block"
          >
            <ChevronRight size={16} className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Candidato */}
        {!collapsed && (
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
          {!collapsed && <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider px-3 mb-2">Principal</div>}

          <NavItem icon={Activity} label="Visão Geral"
            active={pathname === '/'}
            onClick={() => { router.push('/'); setMobileOpen(false) }}
            collapsed={collapsed}
          />
          <NavItem icon={Map} label="Mapa Eleitoral"
            active={isDashboard}
            onClick={() => { router.push('/dashboard'); setMobileOpen(false) }}
            collapsed={collapsed}
          />
          <NavItem icon={FileText} label="Demandas"
            active={false}
            onClick={() => { router.push('/dashboard'); setMobileOpen(false) }}
            collapsed={collapsed}
          />
          <NavItem icon={BarChart3} label="Previsões"
            active={pathname === '/previsoes'}
            onClick={() => { router.push('/previsoes'); setMobileOpen(false) }}
            collapsed={collapsed}
          />

          {!collapsed && <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider px-3 mb-2 mt-4">Inteligência</div>}

          <NavItem icon={Bot} label="Oráculo IA"
            active={false}
            onClick={() => { router.push('/dashboard'); setMobileOpen(false) }}
            collapsed={collapsed}
          />
          <NavItem icon={Shield} label="Segurança"
            active={false}
            onClick={() => {}}
            collapsed={collapsed}
          />
          <NavItem icon={Star} label="Relatórios"
            active={pathname === '/relatorios'}
            onClick={() => { router.push('/relatorios'); setMobileOpen(false) }}
            collapsed={collapsed}
          />
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/[0.04] shrink-0">
          <NavItem icon={LogOut} label="Sair"
            active={false}
            onClick={() => signOut(() => router.push('/login'))}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 border-b border-white/[0.04] flex items-center justify-between px-4 md:px-6 shrink-0 bg-[#080808]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 pl-8 md:pl-0">
            <div>
              <h1 className="text-sm font-semibold text-slate-200">
                {isDashboard ? 'Mapa Eleitoral' : `Bom dia, ${candidateName} 👋`}
              </h1>
              <p className="text-xs text-slate-600 hidden sm:block">
                Uberlândia · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
            </button>
            {!isDashboard && (
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all duration-200"
              >
                <Map size={14} />
                <span className="hidden sm:inline">Ver Mapa</span>
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
