import Image from 'next/image'

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

// A logo usa a imagem PNG original com fundo preto removido via mix-blend-mode
// O fundo escuro da imagem some quando a página também é escura
export function Logo({ size = 40, showText = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ lineHeight: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          position: 'relative',
          flexShrink: 0,
          // mix-blend-mode screen faz o fundo preto da imagem ficar transparente
          // mantendo apenas o cavalo roxo visível
          mixBlendMode: 'screen',
          filter: 'saturate(1.1)',
        }}
      >
        <Image
          src="/logo-oraculo.png"
          alt="Oráculo"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: `${Math.max(size * 0.35, 12)}px`,
            fontWeight: 700,
            letterSpacing: '0.18em',
            background: 'linear-gradient(135deg, #D946EF 0%, #9333EA 50%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}
        >
          ORÁCULO
        </span>
      )}
    </div>
  )
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return <Logo size={size} showText={false} />
}

export function LogoFull({ size = 40 }: { size?: number }) {
  return <Logo size={size} showText={true} />
}
