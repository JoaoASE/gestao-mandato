'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';
import { ChevronLeft, TrendingUp, Map as MapIcon, BarChart2, CheckCircle2, ChevronDown } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const CARGOS = [
  "Deputado Estadual",
  "Deputado Federal",
  "Governador",
  "Senador",
  "Presidente"
];

// Mock dados de projeções caso não tenha no DB ainda para demonstrar visualmente
const MOCK_PROJECTIONS = [
  { candidateName: 'Candidato A', projectedVotes: 45000, color: '#8b5cf6' },
  { candidateName: 'Candidato B', projectedVotes: 32000, color: '#3b82f6' },
  { candidateName: 'Candidato C', projectedVotes: 28000, color: '#10b981' },
  { candidateName: 'Candidato D', projectedVotes: 15000, color: '#f59e0b' },
  { candidateName: 'Candidato E', projectedVotes: 8000, color: '#ef4444' }
];

export default function Previsoes() {
  const router = useRouter();
  const [selectedCargo, setSelectedCargo] = useState(CARGOS[0]);
  const [viewMode, setViewMode] = useState<'mapa' | 'graficos'>('graficos');
  const [bairrosProj, setBairrosProj] = useState<any[]>([]);

  useEffect(() => {
    // Aqui no futuro buscar da API /api/previsoes?cargo=...
    // Simulando heatmap (bairros e suas projeções para o Top 1)
    fetch('/api/estatisticas')
      .then(r => r.json())
      .then(data => {
        const comProjecao = data.map((b: any) => ({
          ...b,
          // Simula intensidade de votos de 0 a 100% para heatmap
          intensidade: Math.random() * 100 
        }));
        setBairrosProj(comProjecao);
      });
  }, [selectedCargo]);

  // Estilo heatmap dinâmico
  const heatmapLayer: any = {
    id: 'bairros-heatmap',
    type: 'fill',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'intensidade'], // Assumindo que injetaremos essa prop no GeoJSON ou faremos match
        0, 'rgba(139, 92, 246, 0.05)',  // purple-500 baixo
        50, 'rgba(139, 92, 246, 0.4)',  // purple-500 medio
        100, 'rgba(139, 92, 246, 0.8)'  // purple-500 forte
      ],
      'fill-opacity': 0.7
    }
  };

  const outlineStyle: any = {
    id: 'bairros-outline',
    type: 'line',
    paint: {
      'line-color': '#a855f7',
      'line-width': 1,
      'line-opacity': 0.3
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-200 overflow-hidden font-sans">
      
      {/* HEADER PREMIUM */}
      <header className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-[#0a0a0a] z-10 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-cyan-400" size={24} />
              <h1 className="text-2xl font-black tracking-tighter text-white">
                Previsões 2022
              </h1>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
              Inteligência Eleitoral Antecipada
            </p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex items-center gap-6">
          
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode('graficos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'graficos' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <BarChart2 size={16} /> Painel Analítico
            </button>
            <button
              onClick={() => setViewMode('mapa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'mapa' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <MapIcon size={16} /> Mapa de Calor
            </button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <select 
              value={selectedCargo}
              onChange={(e) => setSelectedCargo(e.target.value)}
              className="relative appearance-none bg-[#0a0a0a] border border-slate-700 text-white text-sm font-bold rounded-xl px-5 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer shadow-xl"
            >
              {CARGOS.map(cargo => (
                <option key={cargo} value={cargo}>{cargo}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 relative overflow-y-auto custom-scrollbar">
        
        {viewMode === 'graficos' ? (
          <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 p-6 rounded-3xl border border-purple-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp size={100} />
                </div>
                <p className="text-xs text-purple-300 uppercase font-black tracking-widest mb-2 relative z-10">Total Projetado (1º Colocado)</p>
                <p className="text-4xl font-black text-white relative z-10">45.000 <span className="text-sm text-slate-400 font-normal">votos</span></p>
                <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-bold relative z-10">
                  <TrendingUp size={16} /> +12% vs mês anterior
                </div>
              </div>
              
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Vantagem sobre o 2º</p>
                <p className="text-3xl font-black text-cyan-400">13.000 <span className="text-sm text-slate-500 font-normal">votos</span></p>
                <p className="mt-4 text-sm text-slate-400 font-medium">Margem confortável na zona sul.</p>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Confiança da IA</p>
                <p className="text-3xl font-black text-green-400">89.5%</p>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: '89.5%' }}></div>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Baseado em 120 variáveis</p>
              </div>
            </div>

            {/* Gráfico Principal */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-sm">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <BarChart2 className="text-purple-400" />
                Intenção de Votos Projetada ({selectedCargo})
              </h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PROJECTIONS} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" />
                    <XAxis type="number" stroke="#475569" fontSize={12} tickFormatter={(value) => value.toLocaleString('pt-BR')} />
                    <YAxis dataKey="candidateName" type="category" stroke="#94a3b8" fontSize={13} width={100} fontWeight="bold" />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #334155', borderRadius: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Votos']}
                    />
                    <Bar dataKey="projectedVotes" radius={[0, 8, 8, 0]} barSize={32}>
                      {MOCK_PROJECTIONS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-900 animate-in fade-in duration-500">
            {/* MAPA DE CALOR */}
            <Map
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{ longitude: -48.2772, latitude: -18.9186, zoom: 11.5 }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
            >
              <Source id="bairros-data" type="geojson" data="/uberlandia-bairros.json">
                <Layer {...heatmapLayer} />
                <Layer {...outlineStyle} />
              </Source>
            </Map>

            {/* LEGENDA FLUTUANTE DO MAPA */}
            <div className="absolute bottom-8 right-8 bg-[#0a0a0a]/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl z-20 w-64">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">Concentração de Votos</p>
              <div className="flex h-3 w-full rounded-full bg-gradient-to-r from-slate-800 via-purple-500/50 to-purple-500"></div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-2">
                <span>Baixa</span>
                <span>Alta</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                  <span className="font-bold">Candidato A (Líder)</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
