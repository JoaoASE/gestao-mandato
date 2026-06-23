'use client'

import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex overflow-hidden" style={{ background: '#05030F' }}>

      {/* Grid sutil de fundo */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Glow central */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(109,40,217,0.18) 0%, transparent 70%)',
      }} />

      {/* ── ESQUERDO — logo + marca ── */}
      <div className="hidden lg:flex flex-col items-center justify-center w-[55%] relative p-16">
        <div className="flex flex-col items-center gap-8">

          {/* Logo sem quadrado — imagem transparente fluindo no fundo */}
          <div style={{ width: 320, height: 320, position: 'relative' }}>
            <Image
              src="/logo-oraculo-transparent.png"
              alt="Oráculo Eleitoral"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-wide" style={{
              background: 'linear-gradient(135deg, #E879F9 0%, #A855F7 40%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.15em',
            }}>
              ORÁCULO
            </h1>
            <p className="text-slate-500 text-sm tracking-wider uppercase">
              Inteligência Eleitoral
            </p>
          </div>

        </div>
      </div>

      {/* Divisória vertical */}
      <div className="hidden lg:block w-px self-stretch my-16" style={{
        background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent)',
      }} />

      {/* ── DIREITO — formulário ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">

        {/* Logo mobile */}
        <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
          <div style={{ width: 140, height: 140, position: 'relative' }}>
            <Image
              src="/logo-oraculo-transparent.png"
              alt="Oráculo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <span className="text-lg font-bold tracking-widest" style={{
            background: 'linear-gradient(135deg, #E879F9, #9333EA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ORÁCULO
          </span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-lg font-semibold text-slate-200">Acesse sua conta</h2>
            <p className="text-xs text-slate-600 mt-1">Painel estratégico eleitoral · Uberlândia</p>
          </div>

          <style>{`
            .cl-rootBox { width: 100%; }
            .cl-card { background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
            .cl-header { display: none !important; }
            .cl-formFieldLabel { color: #94a3b8 !important; font-size: 12px !important; }
            .cl-formFieldInput {
              background: rgba(255,255,255,0.04) !important;
              border: 1px solid rgba(255,255,255,0.08) !important;
              color: #e2e8f0 !important;
              border-radius: 12px !important;
            }
            .cl-formFieldInput:focus {
              border-color: rgba(147,51,234,0.5) !important;
              box-shadow: 0 0 0 2px rgba(147,51,234,0.12) !important;
              outline: none !important;
            }
            .cl-formButtonPrimary {
              background: linear-gradient(135deg, #9333EA, #7C3AED) !important;
              border-radius: 12px !important;
              font-weight: 600 !important;
              letter-spacing: 0.03em !important;
              border: none !important;
            }
            .cl-formButtonPrimary:hover { opacity: 0.88 !important; }
            .cl-footerActionLink { color: #A855F7 !important; }
            .cl-footerActionText { color: #475569 !important; }
            .cl-dividerLine { background: rgba(255,255,255,0.06) !important; }
            .cl-dividerText { color: #475569 !important; font-size: 12px !important; }
            .cl-socialButtonsBlockButton {
              background: rgba(255,255,255,0.03) !important;
              border: 1px solid rgba(255,255,255,0.07) !important;
              border-radius: 12px !important;
              color: #94a3b8 !important;
            }
            .cl-socialButtonsBlockButton:hover { background: rgba(139,92,246,0.08) !important; border-color: rgba(139,92,246,0.25) !important; }
            .cl-socialButtonsBlockButtonText { color: #94a3b8 !important; }
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
            .cl-card__main { gap: 16px !important; }
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
                header: 'hidden',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
