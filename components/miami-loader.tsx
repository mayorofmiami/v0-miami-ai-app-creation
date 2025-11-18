"use client"

export function MiamiLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-miami-dark)]">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-miami-aqua)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-float-slow" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[var(--color-miami-pink)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-float-slower" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[var(--color-miami-aqua)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-float-slowest" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated logo container */}
        <div className="relative">
          {/* Pulsing glow rings */}
          <div className="absolute inset-0 -m-4">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-miami-aqua)] opacity-40 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-miami-pink)] opacity-30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
          </div>

          {/* Logo with neon glow */}
          <div className="relative px-8 py-4 rounded-2xl bg-black/40 backdrop-blur-sm border border-[var(--color-miami-aqua)]/30">
            <div className="text-4xl md:text-5xl font-bold gradient-text animate-pulse">
              Miami.ai
            </div>
          </div>
        </div>

        {/* Animated loading bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, var(--color-miami-aqua) 25%, var(--color-miami-pink) 50%, var(--color-miami-aqua) 75%, transparent 100%)',
              backgroundSize: '200% 100%'
            }}
          />
        </div>

        {/* Loading text */}
        <div className="text-sm text-white/60 animate-pulse">
          Loading your AI workspace...
        </div>
      </div>
    </div>
  )
}
