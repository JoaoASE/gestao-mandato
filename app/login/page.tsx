'use client';

import React, { useState } from 'react';
import { BrainCircuit, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login or recovery process
    setTimeout(() => {
      setIsLoading(false);
      if (!isForgotPassword) {
        // Redireciona para o dashboard após login "sucesso"
        router.push('/');
      } else {
        alert('Um link de recuperação foi enviado para o seu e-mail.');
        setIsForgotPassword(false);
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Elementos de fundo dinâmicos (efeito premium) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Container principal de Login (Glassmorphism) */}
      <div className="w-full max-w-md p-8 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-slate-800/60 rounded-3xl shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Cabeçalho do Login */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-purple-500/10 rounded-2xl mb-4 border border-purple-500/20">
            <BrainCircuit className="text-purple-400" size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text text-transparent mb-2">
            ORÁCULO
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold font-mono text-center">
            {isForgotPassword ? 'Recuperação de Acesso' : 'Autenticação Restrita'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            {/* Input de E-mail */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-mail de acesso"
                className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-xl pl-11 py-3.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Input de Senha (só mostra se não for recuperar senha) */}
            <div className={`relative group overflow-hidden transition-all duration-500 ease-in-out ${isForgotPassword ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isForgotPassword}
                placeholder="Palavra-passe"
                className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-xl pl-11 py-3.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Esqueceu a senha link */}
          {!isForgotPassword && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-xs text-slate-400 hover:text-cyan-400 font-semibold transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={isLoading || (!email && !password && !isForgotPassword)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] mt-6 group"
          >
            {isLoading ? (
              <BrainCircuit className="animate-spin" size={18} />
            ) : isForgotPassword ? (
              'Enviar Link de Recuperação'
            ) : (
              <>
                Entrar no Oráculo
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Voltar ao Login */}
          {isForgotPassword && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full flex items-center justify-center gap-2 mt-4 text-xs text-slate-500 hover:text-slate-300 font-semibold transition-colors"
            >
              <ArrowLeft size={14} /> Voltar para o Login
            </button>
          )}

        </form>

        {/* Rodapé do Login */}
        <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
          <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            Acesso Restrito &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </main>
  );
}
