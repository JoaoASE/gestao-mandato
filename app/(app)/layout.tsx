'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import {
  Zap, Activity, Map, FileText, BarChart3, Bot,
  Shield, Star, LogOut, ChevronRight, Bell, Menu, X, Send
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
  const [oraculoOpen, setOraculoOpen] = useState(false)
  const [oraculoMessages, setOraculoMessages] = useState<{role:string,content:string}[]>([])
  const [oraculoInput, setOraculoInput] = useState('')
  const [oraculoLoading, setOraculoLoading] = useState(false)
  async function sendOraculo(e: React.FormEvent) {
    e.preventDefault()
    if (!oraculoInput.trim() || oraculoLoading) return
    const userMsg = { role: 'user', content: oraculoInput }
    const newMessages = [...oraculoMessages, userMsg]
    setOraculoMessages(newMessages)
    setOraculoInput('')
    setOraculoLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          data: { context: {} }
        })
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let aiContent = ''
      setOraculoMessages(prev => [...prev, { role: 'assistant', content: '' }])
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        aiContent += decoder.decode(value, { stream: true })
        const cleaned = aiContent.replace(/^[0-9a-f]+(\r?\n)/gm, '').replace(/^"(.*)"$/gm, '$1')
        setOraculoMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: cleaned.replace(/0:"/g,'').replace(/"/g,'').trim() }
          return updated
        })
      }
    } catch {
      setOraculoMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com o Oráculo.' }])
    } finally {
      setOraculoLoading(false)
    }
  }



  const [candidateName, setCandidateName] = useState('...')
  useEffect(() => {
    if (user) setCandidateName(user.firstName || user.fullName || 'Candidato')
  }, [user])

  const isDashboard = pathname?.includes('/dashboard')

  return (
    <div className="flex h-screen w-full bg-[#050505] text-slate-200 overflow-hidden font-sans bg-grid" suppressHydrationWarning>

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
            active={pathname === '/demandas'}
            onClick={() => { router.push('/demandas'); setMobileOpen(false) }}
            collapsed={collapsed}
          />
          <NavItem icon={BarChart3} label="Previsões"
            active={pathname === '/previsoes'}
            onClick={() => { router.push('/previsoes'); setMobileOpen(false) }}
            collapsed={collapsed}
          />

          {!collapsed && <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider px-3 mb-2 mt-4">Inteligência</div>}

          <NavItem icon={Bot} label="Oráculo IA"
            active={oraculoOpen}
            onClick={() => { setOraculoOpen(!oraculoOpen); setMobileOpen(false) }}
            collapsed={collapsed}
          />
          <NavItem icon={Shield} label="Segurança"
            active={pathname === '/seguranca'}
            onClick={() => { router.push('/seguranca'); setMobileOpen(false) }}
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
              <p className="text-xs text-slate-600 hidden sm:block" suppressHydrationWarning>
                Uberlândia · {typeof window !== 'undefined' ? new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
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

      {/* ── ORÁCULO IA PANEL ── */}
      {oraculoOpen && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-[#080808] border-l border-white/[0.04] flex flex-col z-50 shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Oráculo IA</div>
                <div className="text-[10px] text-slate-600">Consultor estratégico eleitoral</div>
              </div>
            </div>
            <button onClick={() => setOraculoOpen(false)} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {oraculoMessages.length === 0 && (
              <div className="space-y-3">
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <Bot size={22} className="text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300 mb-1">Oráculo pronto</p>
                  <p className="text-xs text-slate-600">Clique em um bairro no mapa ou faça uma pergunta estratégica.</p>
                </div>
                {["Qual bairro devo priorizar?", "Monte um plano para os próximos 30 dias", "Onde estão meus votos perdidos?"].map(q => (
                  <button key={q} onClick={() => { setOraculoInput(q) }}
                    className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/20 hover:bg-purple-500/[0.03] transition-all text-xs text-slate-400">
                    💡 {q}
                  </button>
                ))}
              </div>
            )}
            {oraculoMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                  ${m.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : 'bg-white/[0.04] text-slate-200 rounded-bl-sm border border-white/[0.04]'
                  }`}>
                  {m.content || <span className="inline-block w-4 h-1 bg-purple-400 rounded animate-pulse" />}
                </div>
              </div>
            ))}
            {oraculoLoading && oraculoMessages[oraculoMessages.length-1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/[0.04] rounded-2xl rounded-bl-sm px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendOraculo} className="p-4 border-t border-white/[0.04] shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={oraculoInput}
                onChange={e => setOraculoInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendOraculo(e as any) } }}
                placeholder="Pergunte ao Oráculo..."
                rows={2}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-purple-500/40 transition-colors custom-scrollbar"
              />
              <button type="submit" disabled={oraculoLoading || !oraculoInput.trim()}
                className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-colors shrink-0">
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-700 mt-2 text-center">Enter para enviar · Shift+Enter para nova linha</p>
          </form>
        </div>
      )}
    </div>
  )
}
