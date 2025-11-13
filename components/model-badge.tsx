"use client"

interface ModelBadgeProps {
  model: string
  reason?: string
  autoSelected?: boolean
  className?: string
}

function getModelName(model: string) {
  if (model.includes("gpt-4o-mini")) return "GPT-4o Mini"
  if (model.includes("gpt-4o")) return "GPT-4o"
  if (model.includes("claude") && model.includes("sonnet")) return "Claude Sonnet"
  if (model.includes("claude") && model.includes("haiku")) return "Claude Haiku"
  if (model.includes("gemini")) return "Gemini 2.0 Flash"
  if (model.includes("llama")) return "Llama 3.3 70B"
  return model
}

export function ModelBadge({ model, className }: ModelBadgeProps) {
  const displayName = getModelName(model)

  return <span className={`text-[10px] md:text-xs text-muted-foreground/70 ${className || ""}`}>{displayName}</span>
}
