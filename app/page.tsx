'use client';



import React, { useEffect, useState, useRef } from 'react';

import Map, { Source, Layer } from 'react-map-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useChat } from '@ai-sdk/react';

import {

  LayoutDashboard,

  TrendingUp,

  Users,

  Map as MapIcon,

  Zap,

  Bot,

  Send,

  BrainCircuit,

  Sparkles,

  ChevronRight,

  ChevronLeft,
  Search,
  FileText,
  Activity,
  ShieldAlert,
  Droplets,
  Bus,
  TreePine,
  Clock,
  HeartPulse
} from 'lucide-react';
import { useRouter } from 'next/navigation';



const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;



export default function Dashboard() {
  const [estatisticas, setEstatisticas] = useState<any[]>([]);
  const [statsSocial, setStatsSocial] = useState({ totalAnalfabetos: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const router = useRouter();

  const [selectedBairro, setSelectedBairro] = useState<any>(null);
  const [isAddingDemand, setIsAddingDemand] = useState(false);
  const [newDemandText, setNewDemandText] = useState('');
  const [isSubmittingDemand, setIsSubmittingDemand] = useState(false);

 

  // UX State

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);



  const messagesEndRef = useRef<HTMLDivElement>(null);



  const [promptContent, setPromptContent] = useState("");

  const [isManualLoading, setIsManualLoading] = useState(false);

  // Usamos useChat apenas para gerenciar o estado das mensagens
  const { messages, setMessages } = useChat({
    api: '/api/chat',
  });

  const isLoading = isManualLoading;



  const submitDemand = async () => {
    if (!newDemandText.trim() || !selectedBairro) return;
    setIsSubmittingDemand(true);
    try {
      const res = await fetch('/api/demandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          neighborhoodId: selectedBairro.id,
          description: newDemandText
        })
      });
      if (res.ok) {
        const demand = await res.json();
        setSelectedBairro((prev: any) => ({
          ...prev,
          demandas: [demand, ...(prev.demandas || [])]
        }));
        setNewDemandText('');
        setIsAddingDemand(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDemand(false);
    }
  };

  useEffect(() => {

    // Busca Estatísticas de Bairro (Cores e Perfil)

    fetch('/api/estatisticas').then(res => res.json()).then(data => setEstatisticas(Array.isArray(data) ? data : []));



    // Busca Dados Demográficos (IBGE)

    fetch('/api/demografia').then(res => res.json()).then(data => setStatsSocial(data?.error ? { totalAnalfabetos: 0 } : data));

  }, []);



  // Auto-scroll para o final do chat

  useEffect(() => {

    if (messagesEndRef.current) {

      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

    }

  }, [messages]);



  const submitWithContext = async (e?: React.FormEvent) => {

    if (e && e.preventDefault) e.preventDefault();

    if (!promptContent.trim() || isLoading) return;

   

    const messageContent = promptContent.trim();

    setPromptContent(''); // Limpa UI instantaneamente

   

    // Inject selected neighborhood info se tiver

    const contextObj = selectedBairro

      ? {

          nome: selectedBairro.nome,

          rendaMedia: selectedBairro.rendaMedia,

          perfilVotacao: selectedBairro.perfilVotacao

        }

      : null;

     

    try {
      setIsManualLoading(true);

      const userMsg = { id: Date.now().toString(), role: 'user', content: messageContent };
      // Adiciona mensagem do usuário
      setMessages(prev => [...(prev || []), userMsg as any]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...(messages || []), userMsg],
          data: contextObj ? { context: contextObj } : undefined
        })
      });

      if (!response.ok) throw new Error("Erro na API");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
      // Adiciona bolha vazia do assistente
      setMessages(prev => [...(prev || []), assistantMsg as any]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantMsg.content += chunk;
        
        // Atualiza a bolha do assistente em tempo real
        setMessages(prev => {
          const newMessages = [...(prev || [])];
          newMessages[newMessages.length - 1] = { ...assistantMsg } as any;
          return newMessages;
        });
      }

    } catch (err: any) {

      console.error("SDK falhou ao processar pacote interno:", err);

      alert("Houve uma falha interna no oráculo: " + err?.message);

    } finally {
      setIsManualLoading(false);
    }

  };



  // ESTILOS DO MAPA

  const layerStyle: any = {
    id: 'bairros-fill',
    type: 'fill',
    paint: {
      'fill-color': '#8b5cf6',
      'fill-opacity': 0.05
    }
  };

  const outlineStyle: any = {
    id: 'bairros-outline',
    type: 'line',
    paint: {
      'line-color': '#a855f7',
      'line-width': 2,
      'line-opacity': 0.6
    }
  };

  const highlightStyle: any = {
    id: 'bairros-highlight',
    type: 'fill',
    paint: {
      'fill-color': '#c084fc',
      'fill-opacity': 0.4
    },
    filter: ['==', 'nome', selectedBairro?.nome || '']
  };



  return (

    <main className="flex h-screen w-full bg-[#050505] text-slate-200 overflow-hidden font-sans">

     

      {/* SIDEBAR INTELIGENTE (Flexbox e Transições) */}

      <div

        className={`${isSidebarExpanded ? 'w-[550px]' : 'w-[320px]'} transition-all duration-300 ease-in-out border-r border-slate-800/50 flex flex-col bg-[#0a0a0a] z-20 shadow-2xl relative shrink-0`}

      >

       

        {/* Cabecalho e Botao Collapse */}

        <div className="p-6 pb-4 border-b border-slate-800/50 flex justify-between items-start shrink-0">

          <div>

            <div className="flex items-center gap-2 mb-1">

              <BrainCircuit className="text-purple-400 shrink-0" size={24} />

              <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">

                ORÁCULO

              </h1>

            </div>

            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono whitespace-nowrap">Assistente IA</p>

          </div>



          <button

            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}

            className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors"

            title="Expandir/Comprimir Oráculo"

          >

            {isSidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}

          </button>

        </div>



        {/* Zona Scrolável da Sidebar Principal */}

        <div className="flex-1 flex flex-col p-6 pt-4 gap-6 overflow-y-auto overflow-x-hidden custom-scrollbar">

         

          <nav className={`space-y-2 shrink-0 ${isSidebarExpanded ? 'flex gap-2 space-y-0' : ''}`}>

            <div className="flex-1 flex items-center gap-3 p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 cursor-pointer">

              <LayoutDashboard size={18} className="shrink-0" />

              <span className="text-sm font-semibold whitespace-nowrap">Dados</span>

            </div>

            <div 
              onClick={() => router.push('/previsoes')}
              className="flex-1 flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-800/30 rounded-xl transition-all cursor-pointer"
            >

              <TrendingUp size={18} className="shrink-0" />

              <span className="text-sm font-semibold whitespace-nowrap">Previsões</span>

            </div>

            <div 

              onClick={() => router.push('/relatorios')}

              className="flex-1 flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-800/30 rounded-xl transition-all cursor-pointer"

            >

              <FileText size={18} className="shrink-0" />

              <span className="text-sm font-semibold whitespace-nowrap">Relatórios</span>

            </div>

          </nav>



          <div className={`shrink-0 space-y-3 ${isSidebarExpanded ? 'grid grid-cols-2 gap-3 space-y-0' : 'mt-auto'}`}>

            {/* Widget 1: IA Status */}

            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 relative overflow-hidden group">

              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center gap-2 mb-2 text-purple-400">

                <Bot size={14} className="shrink-0" />

                <p className="text-[10px] uppercase font-bold tracking-wider truncate">Status do Oráculo</p>

              </div>

              <p className="text-lg font-bold text-white flex items-center gap-2 truncate">

                <span className="relative flex h-3 w-3 shrink-0">

                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>

                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>

                </span>

                Online

              </p>

            </div>



            {/* Widget 2: Alerta Social (IBGE) */}

            <div className="p-4 bg-purple-900/10 rounded-2xl border border-purple-500/20 backdrop-blur-sm">

              <div className="flex items-center gap-2 mb-2 text-purple-300">

                <Users size={14} className="shrink-0" />

                <p className="text-[10px] uppercase font-bold tracking-wider truncate">Alerta Educação</p>

              </div>

              <p className="text-2xl font-black text-white truncate">

                {statsSocial?.totalAnalfabetos?.toLocaleString('pt-BR') || '0'}

              </p>

              <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold truncate">População Crítica</p>

            </div>

          </div>



          {/* CHAT HISTORY EMBUTIDO (Apenas se expandido e tiver msg ou for expandido por default) */}

          {isSidebarExpanded && (

            <div className="flex-1 flex flex-col gap-4 mt-2 mb-2 border-t border-slate-800/50 pt-6">

              {messages.length === 0 ? (

                <div className="text-center text-slate-500 text-sm italic my-auto">

                  Nenhuma conversa ainda. O Oráculo aguarda suas perguntas.

                </div>

              ) : (

                messages.map(m => (

                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                    <div className={`p-4 rounded-xl max-w-[90%] text-sm leading-relaxed ${m.role === 'user' ? 'bg-purple-600/30 text-purple-100 border border-purple-500/30 rounded-br-none' : 'bg-slate-800/80 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-lg'}`}>

                      {m.role === 'assistant' && (

                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">

                          <Bot size={14} className="text-purple-400" />

                          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Oráculo</span>

                        </div>

                      )}

                      <div className="whitespace-pre-wrap">{m.content}</div>

                    </div>

                  </div>

                ))

              )}

              {isLoading && (

                <div className="flex justify-start">

                  <div className="p-4 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/80 rounded-bl-none shadow-lg flex items-center gap-3">

                    <BrainCircuit className="animate-spin text-purple-400" size={16} />

                    <span className="text-xs font-mono text-slate-400">Calculando estratégia...</span>

                  </div>

                </div>

              )}

              <div ref={messagesEndRef} />

            </div>

          )}



        </div>



        {/* ABA DE INPUT DE CHAT FIXA NA BASE */}

        <div className="p-4 bg-slate-900/50 border-t border-slate-800/50 shrink-0">

          <div className="bg-[#0a0a0a] border border-slate-700 p-2 rounded-2xl flex items-end gap-2 focus-within:border-purple-500/50 transition-colors">

            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">

              {isLoading ? <BrainCircuit className="animate-pulse" size={20} /> : <Bot size={20} />}

            </div>

            <form onSubmit={submitWithContext} className="flex-1 flex gap-2">

              <input

                type="text"

                value={promptContent}

                onChange={e => setPromptContent(e.target.value)}

                onKeyDown={e => {

                  e.stopPropagation();

                  if (e.key === 'Enter' && !e.shiftKey) {

                    e.preventDefault();

                    if (promptContent.trim() && !isLoading) {

                      submitWithContext();

                    }

                  }

                }}

                onFocus={() => setIsSidebarExpanded(true)}

                placeholder="Pergunte ao Oráculo..."

                className="w-full bg-transparent border-none text-slate-200 text-sm focus:ring-0 placeholder:text-slate-500 py-3 outline-none"

              />

              <button

                type="submit"

                disabled={isLoading || !promptContent.trim()}

                className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl transition-colors shrink-0"

              >

                <Send size={18} />

              </button>

            </form>

          </div>

        </div>

      </div>



      {/* MAPA PRINCIPAL */}

      <div className="flex-1 relative bg-slate-900 transition-all duration-300 ease-in-out">

        <Map

          mapboxAccessToken={MAPBOX_TOKEN}

          initialViewState={{ longitude: -48.2772, latitude: -18.9186, zoom: 12 }}

          mapStyle="mapbox://styles/mapbox/dark-v11"

          interactiveLayerIds={['bairros-fill']}

          onClick={async e => {
            const feature = e.features && e.features[0];
            if (feature && feature.layer.id === 'bairros-fill') {
              const normalizeString = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
              const featName = normalizeString(feature.properties?.nome || '');
              
              const stats = estatisticas.find(s => {
                const dbName = normalizeString(s.nomeBairro);
                return dbName === featName || dbName.includes(featName) || featName.includes(dbName);
              });

              if (stats) {
                // Seta primeiro o bairro e os status rapidos
                setSelectedBairro({ ...feature.properties, ...stats, historicoVotos: null, demandas: [] });
                
                // Busca async o historico para nao travar a UI global
                try {
                  const res = await fetch(`/api/bairro?id=${stats.id}`);
                  if (res.ok) {
                    const details = await res.json();
                    setSelectedBairro((prev: any) => ({ ...prev, historicoVotos: details.historicoVotos, demandas: details.demandas }));
                  }
                } catch(err) {
                  console.error("Falha ao carregar detalhes", err);
                }
              } else {
                setSelectedBairro({ ...feature.properties });
              }
            } else {
              setSelectedBairro(null);
            }
          }}

        >

          {/* Camada de Bairros (Genérica para a cidade em foco) */}

          <Source id="bairros-data" type="geojson" data="/uberlandia-bairros.json">
            <Layer {...layerStyle} />
            <Layer {...highlightStyle} />
            <Layer {...outlineStyle} />
          </Source>

        </Map>



        {/* INTERFACE DO ORÁCULO (DASHBOARD DO BAIRRO) */}
        {selectedBairro && (
          <div className="absolute top-6 right-6 w-[400px] bg-[#0a0a0a]/95 border border-slate-800 p-6 rounded-2xl shadow-2xl z-30 backdrop-blur-xl animate-in fade-in zoom-in duration-200 custom-scrollbar overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <MapIcon size={20} className="text-cyan-400 shrink-0" />
                <h2 className="text-xl font-black text-white tracking-tight leading-tight">{selectedBairro.nome}</h2>
              </div>
              <button onClick={() => setSelectedBairro(null)} className="text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-lg p-1 px-3 text-lg font-bold">×</button>
            </div>
            
            <div className="space-y-6">
              {/* KPIs principais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Eleitores</p>
                  <p className="text-lg font-bold text-white">{selectedBairro.populacao?.toLocaleString('pt-BR') || '---'}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Renda Média</p>
                  <p className="text-lg font-bold text-green-400">R$ {selectedBairro.rendaMedia?.toLocaleString('pt-BR') || '---'}</p>
                </div>
              </div>

              {/* Indicadores Urbanos */}
              <div>
                <h3 className="text-[11px] text-slate-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                  <Activity size={12} className="text-blue-400" /> Indicadores Urbanos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                    <TreePine size={16} className="text-green-500" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Praças/Lazer</p>
                      <p className="text-sm font-black text-white">{selectedBairro.leisureAreasCount ?? '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                    <ShieldAlert size={16} className="text-red-500" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Roubos/Ano</p>
                      <p className="text-sm font-black text-white">{selectedBairro.securityIncidents ?? '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                    <Droplets size={16} className="text-cyan-500" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Saneamento</p>
                      <p className="text-sm font-black text-white">{selectedBairro.sanitationCoverage ? `${selectedBairro.sanitationCoverage}%` : '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                    <Bus size={16} className="text-yellow-500" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Linhas de Ônibus</p>
                      <p className="text-sm font-black text-white">{selectedBairro.transportLines ?? '---'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status de Saúde (UAIs) */}
              {selectedBairro.healthFacilities && selectedBairro.healthFacilities.length > 0 && (
                <div>
                  <h3 className="text-[11px] text-slate-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                    <HeartPulse size={12} className="text-rose-400" /> Saúde em Tempo Real
                  </h3>
                  <div className="space-y-2">
                    {selectedBairro.healthFacilities.map((fac: any) => (
                      <div key={fac.id} className="bg-slate-900/60 p-3 rounded-lg border border-rose-500/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-orange-500"></div>
                        <div className="flex justify-between items-center mb-2 pl-2">
                          <span className="text-xs font-bold text-white">{fac.name}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase font-bold">{fac.type}</span>
                        </div>
                        <div className="flex items-center justify-between pl-2">
                          <div className="flex items-center gap-2">
                            <Users size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-300"><strong className="text-white">{fac.currentQueueSize}</strong> na fila</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={12} className={fac.averageWaitTime > 60 ? "text-red-400" : "text-green-400"} />
                            <span className={`text-xs font-bold ${fac.averageWaitTime > 60 ? "text-red-400" : "text-green-400"}`}>
                              ~{fac.averageWaitTime} min
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico Eleitoral */}
              {selectedBairro.historicoVotos && selectedBairro.historicoVotos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                      <TrendingUp size={12} className="text-cyan-400" /> Desempenho Histórico
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {Array.from(new Set(selectedBairro.historicoVotos.map((v: any) => v.year.toString()))).sort((a: any, b: any) => b - a).map((year: any) => (
                        <button 
                          key={year}
                          onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                          className={`text-[9px] px-2 py-0.5 rounded border ${selectedYear === year ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-900/50 border-slate-800 text-slate-500'} font-bold transition-all cursor-pointer`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Search size={12} className="text-slate-500" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Buscar candidato..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900/40 border border-slate-800 text-slate-300 text-xs rounded-lg pl-8 py-2 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(() => {
                      let filtered = selectedBairro.historicoVotos;
                      if (selectedYear) {
                         filtered = filtered.filter((v: any) => v.year.toString() === selectedYear);
                      }
                      if (searchQuery.trim()) {
                         const q = searchQuery.toLowerCase();
                         filtered = filtered.filter((v: any) => v.candidateName.toLowerCase().includes(q));
                      } else {
                         filtered = filtered.slice(0, 10);
                      }
                      
                      return filtered.length > 0 ? filtered.map((voto: any) => (
                        <div key={voto.id} className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                          <div>
                            <span className="text-xs font-bold text-slate-300">{voto.year}</span>
                            <p className="text-[10px] text-slate-500 capitalize">{voto.candidateName.toLowerCase().replace('candidato ', '')}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-cyan-400">{voto.votesCount.toLocaleString('pt-BR')}</span>
                            <span className="text-[9px] text-slate-500 ml-1">votos</span>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-slate-600 text-xs italic">Nenhum candidato encontrado.</div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Demandas Recentes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                    <Zap size={12} className="text-yellow-400" /> Demandas Críticas
                  </h3>
                  <button 
                    onClick={() => setIsAddingDemand(!isAddingDemand)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <span className="text-[10px] font-bold">+ Adicionar</span>
                  </button>
                </div>
                
                {isAddingDemand && (
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-purple-500/30 mb-3">
                    <textarea
                      value={newDemandText}
                      onChange={(e) => setNewDemandText(e.target.value)}
                      placeholder="Relato do morador..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 min-h-[60px] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={submitDemand}
                        disabled={isSubmittingDemand || !newDemandText.trim()}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 text-[10px] font-bold rounded transition-colors disabled:opacity-50"
                      >
                        {isSubmittingDemand ? 'Publicando...' : 'Publicar'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedBairro.demandas && selectedBairro.demandas.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBairro.demandas.map((demanda: any) => (
                      <div key={demanda.id} className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/50 border-l-2 border-l-yellow-500">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className="text-xs font-bold text-slate-200 leading-tight">{demanda.title}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 whitespace-nowrap">{demanda.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{demanda.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-600 text-xs italic">Nenhuma demanda relatada.</div>
                )}
              </div>

              {!isSidebarExpanded && (
                <button
                  onClick={() => setIsSidebarExpanded(true)}
                  className="w-full flex items-center justify-center gap-2 mt-2 p-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-xs font-black uppercase transition-all shadow-lg shadow-purple-900/20"
                >
                  <Sparkles size={16} /> Consultar Oráculo sobre território
                </button>
              )}
            </div>
          </div>
        )}



      </div>

    </main>

  );

}