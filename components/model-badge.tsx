"use client"

import { Sparkles, Zap, Brain, Feather } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModelBadgeProps {
  model: string
  reason?: string
  autoSelected?: boolean
  className?: string
}

function getModelIcon(model: string) {
  if (model.includes("gpt-4o-mini")) return <Zap className="h-3.5 w-3.5" />
  if (model.includes("gpt-4o")) return <Brain className="h-3.5 w-3.5" />
  if (model.includes("claude") && model.includes("sonnet")) return <Feather className="h-3.5 w-3.5" />
  if (model.includes("claude") && model.includes("haiku")) return <Zap className="h-3.5 w-3.5" />
  return <Sparkles className="h-3.5 w-3.5" />
}

function getModelName(model: string) {
  if (model.includes("gpt-4o-mini")) return "GPT-4o Mini"
  if (model.includes("gpt-4o")) return "GPT-4o"
  if (model.includes("claude") && model.includes("sonnet")) return "Claude Sonnet"
  if (model.includes("claude") && model.includes("haiku")) return "Claude Haiku"
  return model
}

export function ModelBadge({ model, reason, autoSelected = true, className }: ModelBadgeProps) {
  const modelName = getModelName(model)
  const icon = getModelIcon(model)

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-xs backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-medium">{modelName}</span>
      </div>
      {reason && autoSelected && (
        <>
          <span className="text-border">•</span>
          <span className="text-muted-foreground/80">{reason}</span>
        </>
      )}
    </div>
  )
}
