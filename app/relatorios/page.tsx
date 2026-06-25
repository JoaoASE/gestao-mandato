'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Database, FileText, ArrowLeft, Loader2, Download } from 'lucide-react'

const SOURCES = [
  { id: 'candidatos',          label: 'Candidatos',                icon: '👤', desc: 'TSE 2008–2024' },
  { id: 'bairros',             label: 'Bairros — Indicadores',     icon: '🏘️', desc: 'Banco de dados' },
  { id: 'resultados_eleitorais', label: 'Resultados por Seção',    icon: '🗳️', desc: 'TSE 2022' },
  { id: 'demandas',            label: 'Demandas Registradas',       icon: '📋', desc: 'Banco de dados' },
  { id: 'partidos',            label: 'Partidos',                  icon: '🏛️', desc: 'TSE Uberlândia' },
  { id: 'perfil_eleitorado',   label: 'Perfil do Eleitorado',      icon: '👥', desc: 'TSE por seção' },
]

const ANO_OPTS = ['', '2024', '2022', '2020', '2016', '2012', '2008']

export default function RelatoriosPage() {
  const router = useRouter()
  const [source, setSource] = useState(SOURCES[0].id)
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [search, setSearch] = useState('')
  const [tempSearch, setTempSearch] = useState('')
  const [ano, setAno] = useState('')
  const [dataSource, setDataSource] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        source, page: String(page), limit: '100',
        search, ano,
      })
      const res = await fetch(`/api/relatorios?${params}`)
      const result = await res.json()
      if (result.data) {
        setData(result.data)
        setColumns(result.columns || (result.data[0] ? Object.keys(result.data[0]) : []))
        setTotalPages(result.totalPages || 1)
        setTotalRows(result.total || 0)
        setDataSource(result.source || '')
      } else {
        setData([]); setColumns([]); setTotalRows(0)
      }
    } catch (e) {
      setData([]); setColumns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [source, page, search, ano])
  useEffect(() => { setPage(1) }, [source, search, ano])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(tempSearch)
  }

  const exportCSV = () => {
    if (!data.length) return
    const header = columns.join(',')
    const rows = data.map(r => columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${source}-pagina${page}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const currentSource = SOURCES.find(s => s.id === source)

  return (
    <div className="flex h-full w-full bg-[#050505] text-slate-200 overflow-hidden font-sans">

      {/* Sidebar */}
      <div className="w-[260px] border-r border-white/[0.04] flex flex-col bg-[#080808] shrink-0">
        <div className="p-4 border-b border-white/[0.04]">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-300 transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar ao painel
          </button>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-purple-400" />
            <div>
              <div className="text-sm font-bold text-slate-200">Relatórios</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">Dados TSE + Banco</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider px-3 mb-2">Bases de dados</div>
          {SOURCES.map(s => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
                ${source === s.id
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                }`}
            >
              <span className="text-base">{s.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.label}</div>
                <div className="text-[10px] text-slate-600">{s.desc}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentSource?.icon}</span>
                <h1 className="text-base font-semibold text-slate-200">{currentSource?.label}</h1>
                {dataSource && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${dataSource === 'TSE' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                    {dataSource === 'TSE' ? '📊 TSE' : '🗄️ Banco'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {totalRows.toLocaleString('pt-BR')} registros encontrados
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Filtro de ano */}
              {['candidatos','resultados_eleitorais','perfil_eleitorado','partidos'].includes(source) && (
                <select
                  value={ano}
                  onChange={e => setAno(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.06] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500/30"
                >
                  <option value="">Todos os anos</option>
                  {ANO_OPTS.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
              <button
                onClick={exportCSV}
                disabled={!data.length}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 text-xs hover:text-slate-200 hover:border-purple-500/20 disabled:opacity-40 transition-all"
              >
                <Download size={13} /> Exportar página
              </button>
            </div>
          </div>

          {/* Busca */}
          <form onSubmit={handleSearch} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={tempSearch}
                onChange={e => setTempSearch(e.target.value)}
                placeholder={`Buscar em ${currentSource?.label?.toLowerCase()}...`}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-purple-500/30 transition-colors"
              />
            </div>
            <button type="submit" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-colors">
              Buscar
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setTempSearch('') }} className="px-3 py-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors">
                Limpar
              </button>
            )}
          </form>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-600">
              <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Database size={32} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-500 font-medium">Nenhum registro encontrado</p>
              <p className="text-xs text-slate-700 mt-1">
                {search ? 'Tente outro termo de busca' : 'Esta base ainda não tem dados importados'}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#080808]">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider border-b border-white/[0.04] whitespace-nowrap">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-2 text-slate-400 max-w-[200px] truncate">
                        {String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-white/[0.04] shrink-0 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Página {page} de {totalPages} · {totalRows.toLocaleString('pt-BR')} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-400 min-w-[60px] text-center">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] disabled:opacity-40 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
