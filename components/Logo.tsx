interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function Logo({ size = 40, showText = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grad-o" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#6B21A8" />
          </linearGradient>
          <linearGradient id="grad-horse" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          <linearGradient id="grad-bars" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#4C1D95" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="grad-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Glow background */}
        <circle cx="50" cy="48" r="40" fill="url(#grad-glow)" />

        {/* Geometric lines inside O */}
        <g opacity="0.25" stroke="#A78BFA" strokeWidth="0.6">
          <line x1="50" y1="12" x2="30" y2="45" />
          <line x1="50" y1="12" x2="70" y2="45" />
          <line x1="30" y1="45" x2="70" y2="45" />
          <line x1="50" y1="12" x2="50" y2="45" />
          <line x1="30" y1="28" x2="70" y2="28" />
          <circle cx="50" cy="18" r="2" fill="#A78BFA" />
        </g>

        {/* Chart bars inside O */}
        <rect x="32" y="52" width="6" height="18" rx="1.5" fill="url(#grad-bars)" />
        <rect x="41" y="44" width="6" height="26" rx="1.5" fill="url(#grad-bars)" />
        <rect x="50" y="38" width="6" height="32" rx="1.5" fill="url(#grad-bars)" />
        <rect x="59" y="46" width="6" height="24" rx="1.5" fill="url(#grad-bars)" />

        {/* The O ring */}
        <circle cx="50" cy="46" r="34" stroke="url(#grad-o)" strokeWidth="7" fill="none" />

        {/* Knight horse body - simplified but recognizable */}
        {/* Base/pedestal */}
        <rect x="34" y="70" width="32" height="5" rx="2.5" fill="url(#grad-horse)" />
        <rect x="37" y="66" width="26" height="5" rx="2" fill="url(#grad-horse)" />

        {/* Body */}
        <path
          d="M42 66 C42 56 40 50 42 44 C43 40 46 37 50 36 C54 35 57 37 58 40 C60 44 59 50 57 55 C56 58 55 62 55 66 Z"
          fill="url(#grad-horse)"
        />

        {/* Neck and head */}
        <path
          d="M42 52 C40 48 39 43 40 38 C41 33 44 29 48 27 C51 25 55 25 57 27 C60 30 61 34 60 38 C59 41 57 43 55 44 C53 45 51 45 50 44 C48 43 46 46 45 49 Z"
          fill="url(#grad-horse)"
        />

        {/* Head detail - ear */}
        <path
          d="M54 27 C55 24 57 23 58 25 C57 27 56 28 54 27 Z"
          fill="#C084FC"
        />

        {/* Eye */}
        <circle cx="55" cy="31" r="2" fill="#1E0A3C" />
        <circle cx="55.5" cy="30.5" r="0.6" fill="#C084FC" />

        {/* Muzzle/nose */}
        <path
          d="M47 36 C46 37 46 39 47 40 C48 41 50 41 51 40"
          stroke="#C084FC"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Mane */}
        <path
          d="M50 27 C51 30 52 33 51 36 C52 33 54 30 54 27"
          stroke="#C084FC"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: `${size * 0.38}px`,
            fontWeight: 700,
            letterSpacing: '0.15em',
            background: 'linear-gradient(135deg, #C084FC 0%, #9333EA 50%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ORÁCULO
        </span>
      )}
    </div>
  )
}

// Logo mark only (just the icon, no text) — for sidebar collapsed state
export function LogoMark({ size = 32 }: { size?: number }) {
  return <Logo size={size} showText={false} />
}

// Full logo with text
export function LogoFull({ size = 40 }: { size?: number }) {
  return <Logo size={size} showText={true} />
}
