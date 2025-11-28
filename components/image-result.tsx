"use client"

interface ImageResultProps {
  imageUrl: string
  prompt: string
  model?: string
  resolution?: string
  createdAt?: string
  onRegenerate?: () => void
}

export function ImageResult({ imageUrl, prompt, model, resolution, onRegenerate }: ImageResultProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6">
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
        <div className="relative aspect-square w-full bg-muted">
          <img src={imageUrl || "/placeholder.svg"} alt={prompt} className="w-full h-full object-contain" />
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{prompt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {model && <span className="font-mono">{model}</span>}
              {resolution && <span>• {resolution}</span>}
            </div>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
