"use client"

export function SkeletonSearch() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-700 space-y-8">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative w-3 h-3 rounded-full"
            style={{
              animation: `elegant-morph 3s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple opacity-70 blur-sm" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple" />
          </div>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground animate-pulse" style={{ animationDuration: '3s' }}>
        Searching...
      </p>
    </div>
  )
}
