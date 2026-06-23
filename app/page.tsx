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
  HeartPulse,
  GraduationCap
} from 'lucide-react';
import bairrosGeoData from '../public/uberlandia-bairros.json';
import { useRouter } from 'next/navigation';



const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;



export default function Dashboard() {
  const [estatisticas, setEstatisticas] = useState<any[]>([]);
  const [statsSocial, setStatsSocial] = useState<any>({ totalAnalfabetos: 0 });
  const [searchQuery, setSearchQuery] = useState(''); // candidato search
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [busRouteGeojson, setBusRouteGeojson] = useState<any>(null);

  const [selectedBairro, setSelectedBairro] = useState<any>(null);
  const [isAddingDemand, setIsAddingDemand] = useState(false);
  const [newDemandText, setNewDemandText] = useState('');
  const [isSubmittingDemand, setIsSubmittingDemand] = useState(false);

  const [searchBairroQuery, setSearchBairroQuery] = useState('');
  const [filteredBairros, setFilteredBairros] = useState<any[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const fetchBairroDetails = async (bairroName: string, bairroId?: string) => {
    try {
      const apiUrl = bairroId ? `/api/bairro?id=${bairroId}` : `/api/bairro?name=${encodeURIComponent(bairroName)}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const details = await res.json();
        setSelectedBairro((prev: any) => ({ ...prev, ...details, historicoVotos: details.historicoVotos, demandas: details.demandas }));
      }
    } catch(err) {
      console.error("Falha ao carregar detalhes", err);
    }
  };

 

  // UX State

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);



  const messagesEndRef = useRef<HTMLDivElement>(null);



  const [promptContent, setPromptContent] = useState("");

  const [isManualLoading, setIsManualLoading] = useState(false);

  // Usamos useChat apenas para gerenciar o estado das mensagens
  const { messages, setMessages } = useChat();

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
    const loadFallbackGeoJson = () => {
       try {
         const names = bairrosGeoData.features.map((f: any) => ({
             id: null,
             nomeBairro: f.properties.nome
         }));
         const seen = new Set<string>();
         const uniqueNames = names.filter((item: any) => {
           if (seen.has(item.nomeBairro)) return false;
           seen.add(item.nomeBairro);
           return true;
         });
         setEstatisticas(uniqueNames as any[]);
       } catch(e) {
         setEstatisticas([]);
       }
    };

    fetch('/api/estatisticas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].nomeBairro) {
           setEstatisticas(data);
        } else {
           loadFallbackGeoJson();
        }
      })
      .catch(() => {
         loadFallbackGeoJson();
      });

    // Busca Dados Demográficos (IBGE)

    fetch('/api/demografia').then(res => res.json()).then(data => setStatsSocial(data?.error ? { totalAnalfabetos: 0 } : data));

  }, []);



  // Auto-scroll para o final do chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!searchBairroQuery.trim()) {
      setFilteredBairros([]);
      setShowSearchDropdown(false);
      return;
    }
    const q = searchBairroQuery.toLowerCase();
    
    // Extrai nomes unicos direto do geojson para busca ser instantanea
    const geoNames = Array.from(new Set(bairrosGeoData.features.map((f:any) => f.properties.nome)));
    const results = geoNames
       .filter(nome => nome?.toLowerCase().includes(q))
       .map(nome => ({ id: null, nomeBairro: nome }));

    setFilteredBairros(results);
    setShowSearchDropdown(true);
  }, [searchBairroQuery]);

  // Efeito para centralizar o mapa no bairro selecionado
  useEffect(() => {
    if (selectedBairro?.feature && mapRef.current) {
      let minX = 180, minY = 90, maxX = -180, maxY = -90;
      try {
        const coords = selectedBairro.feature.geometry.type === 'Polygon' ? selectedBairro.feature.geometry.coordinates[0] : selectedBairro.feature.geometry.coordinates[0][0];
        coords.forEach(([x,y]: number[]) => {
          if(x<minX) minX=x; if(x>maxX) maxX=x;
          if(y<minY) minY=y; if(y>maxY) maxY=y;
        });
        mapRef.current.fitBounds([ [minX, minY], [maxX, maxY] ], { padding: 100, duration: 1500 });
      } catch(e) {}
    }
  }, [selectedBairro?.feature]);

  // Efeito do ônibus removido conforme pedido (apenas lista mantida)
  useEffect(() => {
    if (selectedIndicator !== 'onibus') {
      setBusRouteGeojson(null);
    }
  }, [selectedIndicator]);

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

            {/* Demografia IBGE Global (Sidebar) - Accordion Uberlândia */}
            {statsSocial && statsSocial.total && (
              <div className="flex flex-col gap-3 h-full justify-end">
                  <div 
                     onClick={() => {
                         const current = document.getElementById('demo-accordion');
                         if(current) current.classList.toggle('hidden');
                     }}
                     className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 transition-all cursor-pointer flex justify-between items-center group"
                  >
                     <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Visão Geral (IBGE 2022)</p>
                        <div className="flex items-center gap-2 text-white">
                           <MapIcon size={16} className="text-purple-400" />
                           <span className="font-bold">Uberlândia</span>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
                  </div>

                  <div id="demo-accordion" className="hidden flex-col gap-3 transition-all">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-3">Sexo</p>
                      <div className="space-y-2">
                         <div className="flex justify-between text-xs font-bold">
                            <span className="text-pink-400">{(statsSocial.sexo_percent.Mulheres * 100).toFixed(1)}%</span>
                            <span className="text-blue-400">{(statsSocial.sexo_percent.Homens * 100).toFixed(1)}%</span>
                         </div>
                         <div className="w-full bg-slate-800 rounded-full h-2 flex overflow-hidden">
                            <div className="bg-pink-500 h-full" style={{width: `${statsSocial.sexo_percent.Mulheres * 100}%`}}></div>
                            <div className="bg-blue-500 h-full" style={{width: `${statsSocial.sexo_percent.Homens * 100}%`}}></div>
                         </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-3">Cor/Raça</p>
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-amber-100">B ({(statsSocial.raca_percent.Branca * 100).toFixed(0)}%)</span>
                            <span className="text-amber-600">P ({(statsSocial.raca_percent.Parda * 100).toFixed(0)}%)</span>
                            <span className="text-amber-900">P ({(statsSocial.raca_percent.Preta * 100).toFixed(0)}%)</span>
                         </div>
                         <div className="w-full bg-slate-800 rounded-full h-2 flex overflow-hidden">
                            <div className="bg-amber-100 h-full" style={{width: `${statsSocial.raca_percent.Branca * 100}%`}}></div>
                            <div className="bg-amber-600 h-full" style={{width: `${statsSocial.raca_percent.Parda * 100}%`}}></div>
                            <div className="bg-amber-900 h-full" style={{width: `${statsSocial.raca_percent.Preta * 100}%`}}></div>
                         </div>
                      </div>
                    </div>
                  </div>
              </div>
            )}
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

                      <div className="whitespace-pre-wrap">{(m as any).content ?? m.parts?.map((p: any) => p.text).join('') ?? ''}</div>

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
        
        {/* LUPA DE PESQUISA DE BAIRRO */}
        <div className={`absolute top-6 z-30 w-80 transition-all duration-300 ${selectedBairro ? 'right-[440px]' : 'right-6'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar bairro..." 
              className="w-full bg-[#0a0a0a]/90 backdrop-blur-md border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-lg"
              value={searchBairroQuery}
              onChange={(e) => setSearchBairroQuery(e.target.value)}
              onFocus={() => { if(searchBairroQuery) setShowSearchDropdown(true); }}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            />
          </div>
          {showSearchDropdown && filteredBairros.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 custom-scrollbar overflow-y-auto">
              {filteredBairros.map(b => (
                <div 
                  key={b.id} 
                  className="px-4 py-3 hover:bg-slate-800/50 cursor-pointer text-sm text-slate-300 transition-colors border-b border-slate-800/50 last:border-0"
                  onClick={() => {
                    const feature = bairrosGeoData.features.find((f:any) => f.properties.nome === b.nomeBairro);
                    setSelectedBairro({ ...b, nome: b.nomeBairro, historicoVotos: null, demandas: [], feature });
                    fetchBairroDetails(b.nomeBairro, b.id);
                    setSearchBairroQuery('');
                    setShowSearchDropdown(false);
                  }}
                >
                  {b.nomeBairro}
                </div>
              ))}
            </div>
          )}
        </div>

        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ longitude: -48.2772, latitude: -18.9186, zoom: 12 }}

          mapStyle="mapbox://styles/mapbox/dark-v11"

          interactiveLayerIds={['bairros-fill']}

          onClick={async e => {
            const feature = e.features && e.features[0];
            if (feature && feature.layer?.id === 'bairros-fill') {
              const normalizeString = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
              const featName = normalizeString(feature.properties?.nome || '');
              
              const stats = estatisticas.find(s => {
                const dbName = normalizeString(s.nomeBairro);
                return dbName === featName || dbName.includes(featName) || featName.includes(dbName);
              });

              // Seta primeiro o bairro e os status rapidos (ou apenas properties se nao tiver stats)
              setSelectedBairro({ ...feature.properties, ...(stats || {}), historicoVotos: null, demandas: [], feature });
              
              // Busca async os detalhes para nao travar a UI global
              try {
                // Passa o ID se tiver, senao busca pelo nome no banco
                const apiUrl = stats?.id ? `/api/bairro?id=${stats.id}` : `/api/bairro?name=${encodeURIComponent(feature.properties?.nome || '')}`;
                const res = await fetch(apiUrl);
                if (res.ok) {
                  const details = await res.json();
                  setSelectedBairro((prev: any) => ({ ...prev, ...details, historicoVotos: details.historicoVotos, demandas: details.demandas }));
                }
              } catch(err) {
                console.error("Falha ao carregar detalhes", err);
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
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">População / Eleitores</p>
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
                  <button onClick={() => setSelectedIndicator(selectedIndicator === 'pracas' ? null : 'pracas')} className={`flex items-center text-left gap-3 bg-slate-900/40 p-3 rounded-lg border hover:bg-slate-800 transition-colors cursor-pointer w-full ${selectedIndicator === 'pracas' ? 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.15)]' : 'border-slate-800/50'}`}>
                    <TreePine size={16} className="text-green-500 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Praças/Lazer</p>
                      <p className="text-sm font-black text-white">{selectedBairro.leisureAreasCount ?? '---'}</p>
                    </div>
                  </button>
                  <button onClick={() => setSelectedIndicator(selectedIndicator === 'roubos' ? null : 'roubos')} className={`flex items-center text-left gap-3 bg-slate-900/40 p-3 rounded-lg border hover:bg-slate-800 transition-colors cursor-pointer w-full ${selectedIndicator === 'roubos' ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-slate-800/50'}`}>
                    <ShieldAlert size={16} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Roubos/Ano</p>
                      <p className="text-sm font-black text-white">{selectedBairro.securityIncidents ?? '---'}</p>
                    </div>
                  </button>
                  <button onClick={() => setSelectedIndicator(selectedIndicator === 'educacao' ? null : 'educacao')} className={`flex items-center text-left gap-3 bg-slate-900/40 p-3 rounded-lg border hover:bg-slate-800 transition-colors cursor-pointer w-full ${selectedIndicator === 'educacao' ? 'border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'border-slate-800/50'}`}>
                    <GraduationCap size={16} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Escolas/Educação</p>
                      <p className="text-sm font-black text-white">{Math.floor(Math.random() * 8) + 2}</p>
                    </div>
                  </button>
                  <button onClick={() => setSelectedIndicator(selectedIndicator === 'onibus' ? null : 'onibus')} className={`flex items-center text-left gap-3 bg-slate-900/40 p-3 rounded-lg border hover:bg-slate-800 transition-colors cursor-pointer w-full ${selectedIndicator === 'onibus' ? 'border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.15)]' : 'border-slate-800/50'}`}>
                    <Bus size={16} className="text-yellow-500 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Linhas de Ônibus</p>
                      <p className="text-sm font-black text-white">{selectedBairro.transportLines ?? '---'}</p>
                    </div>
                  </button>
                </div>

                {selectedIndicator && (
                  <div className="mt-3 bg-slate-900/80 border border-slate-800 rounded-lg p-4 animate-in slide-in-from-top-2">
                    {selectedIndicator === 'pracas' && (
                      <div>
                        <h4 className="text-xs text-green-400 font-bold mb-2 flex items-center gap-2"><TreePine size={12}/> Praças e Áreas de Lazer</h4>
                        {(selectedBairro.pracasReais && selectedBairro.pracasReais.length > 0) || (selectedBairro.parquesReais && selectedBairro.parquesReais.length > 0) ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {selectedBairro.parquesReais && selectedBairro.parquesReais.map((p: any, idx: number) => (
                               <div key={`parque-${idx}`} className="bg-green-900/20 p-2 rounded border border-green-800/50">
                                  <p className="text-xs text-green-300 font-bold">{p.parque}</p>
                                  <p className="text-[10px] text-slate-400">{p.rua} • CEP: {p.cep}</p>
                               </div>
                            ))}
                            {selectedBairro.pracasReais && selectedBairro.pracasReais.map((p: any, idx: number) => (
                               <div key={`praca-${idx}`} className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                  <p className="text-xs text-white font-bold">{p.praca}</p>
                                  <p className="text-[10px] text-slate-400">{p.rua} • CEP: {p.cep}</p>
                               </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded border border-slate-800 text-center italic">
                             Nenhuma praça ou parque mapeado para este bairro.
                          </div>
                        )}
                      </div>
                    )}
                    {selectedIndicator === 'roubos' && (
                      <div>
                        <h4 className="text-xs text-red-400 font-bold mb-2 flex items-center gap-2"><ShieldAlert size={12}/> Relatório de Ocorrências</h4>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">Foram registradas cerca de <strong>{selectedBairro.securityIncidents}</strong> ocorrências de furto e roubo neste ano. A maioria dos casos ocorreu no período noturno em vias de acesso principal.</p>
                        <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-2 rounded text-[10px]">
                           <strong>Atenção Recomendada:</strong> Reforço de patrulhamento nas vias centrais.
                        </div>
                      </div>
                    )}
                    {selectedIndicator === 'educacao' && (
                      <div>
                        <h4 className="text-xs text-indigo-400 font-bold mb-2 flex items-center gap-2"><GraduationCap size={12}/> Indicadores de Educação</h4>
                        <div className="space-y-3 mt-3">
                          <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                             <div className="flex justify-between text-xs mb-2 pb-2 border-b border-slate-800"><span className="text-slate-400">Escolas Municipais</span><span className="font-bold text-white">{Math.floor(Math.random() * 4) + 1}</span></div>
                             <div className="flex justify-between text-xs mb-2 pb-2 border-b border-slate-800"><span className="text-slate-400">Escolas Estaduais</span><span className="font-bold text-white">{Math.floor(Math.random() * 3) + 1}</span></div>
                             <div className="flex justify-between text-xs"><span className="text-slate-400">Rede Particular</span><span className="font-bold text-white">{Math.floor(Math.random() * 5)}</span></div>
                          </div>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-900/30 p-2 rounded border border-slate-800">
                             <Activity size={10} className="text-indigo-400"/> Vagas em creche possuem déficit estimado de 15% neste setor.
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedIndicator === 'onibus' && (
                      <div>
                        <h4 className="text-xs text-yellow-400 font-bold mb-2 flex items-center gap-2"><Bus size={12}/> Linhas de Transporte Público</h4>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="bg-slate-800 border border-slate-700 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold">T120</span>
                          <span className="bg-slate-800 border border-slate-700 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold">A115</span>
                          <span className="bg-slate-800 border border-slate-700 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold">T122</span>
                          {selectedBairro.transportLines > 3 && <span className="bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded text-[10px]">+ {selectedBairro.transportLines - 3} linhas transversais</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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