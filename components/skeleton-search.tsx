"use client"

export function SkeletonSearch() {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 space-y-6">
      {/* Gradient shimmer bar */}
      <div className="w-full max-w-md">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-miami-aqua/60 to-transparent bg-[length:200%_100%]" />
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">Searching...</p>
    </div>
  )
}
