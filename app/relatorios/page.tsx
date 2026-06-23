'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, ChevronLeft, ChevronRight, BrainCircuit, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FILES = [
  'Candidatos Uberlandia.csv',
  'Detalhes Secao Eleitoral Uberlandia.csv',
  'Detalhes Zona Eleitoral Uberlandia.csv',
  'Partidos Uberlandia.csv',
  'Perfil Eleitorado por Local Uberlandia.csv',
  'Resultado Candidato por Secao Uberlandia.csv',
  'Resultado Candidato por Zona Uberlandia.csv',
  'censoIBGE.csv'
];

export default function RelatoriosPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(FILES[0]);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Paginação e Busca
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [tempColumnFilters, setTempColumnFilters] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const filtersStr = encodeURIComponent(JSON.stringify(columnFilters));
      const res = await fetch(`/api/csv?file=${encodeURIComponent(selectedFile)}&page=${page}&limit=100&search=${encodeURIComponent(searchQuery)}&filters=${filtersStr}`);
      const result = await res.json();
      
      if (result.data) {
        setData(result.data);
        if (result.data.length > 0) {
          setColumns(Object.keys(result.data[0]));
        } else {
          setColumns([]);
        }
        setTotalPages(result.totalPages);
        setTotalRows(result.totalRows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFile, page, searchQuery, columnFilters]);

  // Reset pagination when file or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedFile, searchQuery, columnFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(tempSearch);
    setColumnFilters(tempColumnFilters);
  };

  return (
    <main className="flex h-screen w-full bg-[#050505] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar Simples */}
      <div className="w-[300px] border-r border-slate-800/50 flex flex-col bg-[#0a0a0a] z-20 shadow-2xl shrink-0">
        <div className="p-6 border-b border-slate-800/50">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-wider mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar ao Painel
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <FileText className="text-cyan-400 shrink-0" size={24} />
            <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              RELATÓRIOS
            </h1>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
            Dados Brutos TSE
          </p>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-2 custom-scrollbar">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-2 mb-3">Bases de Dados</p>
          {FILES.map(file => (
            <button
              key={file}
              onClick={() => {
                 setSelectedFile(file);
                 setTempSearch('');
                 setSearchQuery('');
                 setColumnFilters({});
                 setTempColumnFilters({});
              }}
              className={`w-full text-left p-3 rounded-xl text-xs transition-all ${selectedFile === file ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 border border-transparent'}`}
            >
              {file.replace(' Uberlandia.csv', '').replace('.csv', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
        {/* Header / Barra de Pesquisa */}
        <div className="p-6 border-b border-slate-800/50 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="truncate">
            <h2 className="text-lg font-black text-white truncate">{selectedFile}</h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {loading ? 'Carregando...' : `${totalRows.toLocaleString('pt-BR')} registros encontrados`}
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="flex max-w-md w-full gap-2 shrink-0">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Pesquisar em todas as colunas..."
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 py-2.5 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <button type="submit" className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors">
              Buscar
            </button>
          </form>
        </div>

        {/* Data Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
              <BrainCircuit className="animate-spin text-cyan-500" size={40} />
              <p className="text-sm font-mono tracking-widest uppercase">Processando Base de Dados...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <FileText size={40} className="mb-4 opacity-50" />
              <p className="text-sm">Nenhum registro encontrado para esta pesquisa.</p>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800">
                      {columns.map(col => (
                        <th key={col} className="px-4 py-3 align-top min-w-[150px]">
                          <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-2 truncate" title={col.replace(/_/g, ' ')}>
                            {col.replace(/_/g, ' ')}
                          </div>
                          <input 
                            type="text"
                            placeholder="Filtrar..."
                            value={tempColumnFilters[col] || ''}
                            onChange={e => setTempColumnFilters(prev => ({...prev, [col]: e.target.value}))}
                            onKeyDown={e => {
                               if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSearch(e as any);
                               }
                            }}
                            className="w-full bg-[#050505] border border-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                        {columns.map(col => (
                          <td key={col} className="px-4 py-2.5 text-slate-400 group-hover:text-slate-300">
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-slate-800/50 bg-[#0a0a0a] flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-mono">
            Página <span className="text-white font-bold">{page}</span> de <span className="text-white font-bold">{totalPages || 1}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
