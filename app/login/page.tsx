'use client'

import { SignIn } from '@clerk/nextjs'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#05030F] flex overflow-hidden">

      {/* ── LEFT PANEL — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative p-12 overflow-hidden">

        {/* Background elements */}
        <div className="absolute inset-0 bg-[#05030F]" />
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #4C1D9540 0%, transparent 70%)',
          }}
        />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Corner glow */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #A855F7 0%, transparent 70%)' }}
        />

        {/* Content */}
        <div className="relative z-10">
          <Logo size={48} showText={true} />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Big logo mark */}
          <div className="flex justify-center">
            <Logo size={180} showText={false} />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Inteligência eleitoral<br />
              <span style={{
                background: 'linear-gradient(135deg, #C084FC, #9333EA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                para vencer.
              </span>
            </h1>
            <p className="text-slate-500 mt-4 text-base leading-relaxed max-w-sm">
              Mapeie territórios, entenda eleitores e tome decisões com dados reais de Uberlândia.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '142k', label: 'Eleitores mapeados' },
              { value: '67', label: 'Bairros analisados' },
              { value: 'IA', label: 'Oráculo estratégico' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #C084FC, #9333EA)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
            <p className="text-slate-400 text-sm italic leading-relaxed">
              "Pela primeira vez consegui ver exatamente onde estavam meus votos e onde estava perdendo — isso mudou minha estratégia completamente."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center text-xs font-bold text-white">C</div>
              <div>
                <div className="text-xs font-medium text-slate-300">Candidato Beta</div>
                <div className="text-[10px] text-slate-600">Vereador · Uberlândia</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-slate-700">
          © 2026 Oráculo Eleitoral · Todos os direitos reservados
        </div>
      </div>

      {/* ── RIGHT PANEL — Clerk sign in ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-[#080510]">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
          <Logo size={64} showText={false} />
          <span className="text-lg font-bold tracking-widest"
            style={{
              background: 'linear-gradient(135deg, #C084FC, #9333EA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            ORÁCULO
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-6 hidden lg:block">
            <h2 className="text-xl font-semibold text-slate-200">Acesse sua conta</h2>
            <p className="text-sm text-slate-600 mt-1">Entre para acessar o painel estratégico</p>
          </div>

          {/* Clerk component with dark theme overrides */}
          <style>{`
            .cl-rootBox { width: 100%; }
            .cl-card {
              background: transparent !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }
            .cl-headerTitle { color: #e2e8f0 !important; font-size: 18px !important; }
            .cl-headerSubtitle { color: #64748b !important; }
            .cl-formFieldLabel { color: #94a3b8 !important; font-size: 12px !important; }
            .cl-formFieldInput {
              background: rgba(255,255,255,0.04) !important;
              border: 1px solid rgba(255,255,255,0.08) !important;
              color: #e2e8f0 !important;
              border-radius: 12px !important;
            }
            .cl-formFieldInput:focus {
              border-color: rgba(147,51,234,0.5) !important;
              box-shadow: 0 0 0 2px rgba(147,51,234,0.15) !important;
            }
            .cl-formButtonPrimary {
              background: linear-gradient(135deg, #9333EA, #7C3AED) !important;
              border-radius: 12px !important;
              font-weight: 600 !important;
              letter-spacing: 0.02em !important;
              transition: opacity 0.2s !important;
            }
            .cl-formButtonPrimary:hover { opacity: 0.9 !important; }
            .cl-footerActionLink { color: #A855F7 !important; }
            .cl-dividerLine { background: rgba(255,255,255,0.06) !important; }
            .cl-dividerText { color: #475569 !important; }
            .cl-socialButtonsBlockButton {
              background: rgba(255,255,255,0.03) !important;
              border: 1px solid rgba(255,255,255,0.07) !important;
              border-radius: 12px !important;
              color: #94a3b8 !important;
            }
            .cl-socialButtonsBlockButton:hover {
              background: rgba(255,255,255,0.06) !important;
              border-color: rgba(147,51,234,0.3) !important;
            }
            .cl-identityPreviewText { color: #94a3b8 !important; }
            .cl-identityPreviewEditButton { color: #A855F7 !important; }
            .cl-formResendCodeLink { color: #A855F7 !important; }
            .cl-otpCodeFieldInput {
              background: rgba(255,255,255,0.04) !important;
              border: 1px solid rgba(255,255,255,0.08) !important;
              color: #e2e8f0 !important;
              border-radius: 10px !important;
            }
            .cl-internal-b3fm6y { display: none !important; }
          `}</style>

          <SignIn
            appearance={{
              variables: {
                colorBackground: 'transparent',
                colorText: '#e2e8f0',
                colorTextSecondary: '#94a3b8',
                colorPrimary: '#9333EA',
                colorInputBackground: 'rgba(255,255,255,0.04)',
                colorInputText: '#e2e8f0',
                borderRadius: '12px',
                fontFamily: 'inherit',
              },
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none border-none p-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                header: 'hidden',
              }
            }}
          />
        </div>

        {/* Divider on mobile */}
        <p className="mt-8 text-[11px] text-slate-700 lg:hidden">
          © 2026 Oráculo Eleitoral
        </p>
      </div>
    </div>
  )
}
