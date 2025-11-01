"use client"

import Sparkles from "@/components/icons/Sparkles"
import Zap from "@/components/icons/Zap"
import Brain from "@/components/icons/Brain"
import Feather from "@/components/icons/Feather"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ModelBadgeProps {
  model: string
  reason?: string
  autoSelected?: boolean
  className?: string
}

function getModelIcon(model: string) {
  if (model.includes("gpt-4o-mini")) return <Zap className="h-4 w-4" />
  if (model.includes("gpt-4o")) return <Brain className="h-4 w-4" />
  if (model.includes("claude") && model.includes("sonnet")) return <Feather className="h-4 w-4" />
  if (model.includes("claude") && model.includes("haiku")) return <Zap className="h-4 w-4" />
  return <Sparkles className="h-4 w-4" />
}

function getModelName(model: string) {
  if (model.includes("gpt-4o-mini")) return "GPT-4o Mini"
  if (model.includes("gpt-4o")) return "GPT-4o"
  if (model.includes("claude") && model.includes("sonnet")) return "Claude Sonnet"
  if (model.includes("claude") && model.includes("haiku")) return "Claude Haiku"
  return model
}

export function ModelBadge({ model, reason, autoSelected, className }: ModelBadgeProps) {
  const icon = getModelIcon(model)
  const displayName = getModelName(model)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border-2 border-miami-aqua/30 bg-gradient-to-r from-miami-aqua/10 to-miami-blue/10 px-4 py-2 text-sm backdrop-blur-sm hover:border-miami-aqua/50 hover:shadow-lg hover:shadow-miami-aqua/20 transition-all cursor-help",
              className,
            )}
          >
            <div className="text-miami-aqua">{icon}</div>
            <span className="font-semibold text-foreground">{displayName}</span>
            {autoSelected && <span className="text-xs text-miami-aqua/70 font-medium">AUTO</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">AI Model: {displayName}</p>
            {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
            {autoSelected && <p className="text-xs text-miami-aqua">Automatically selected for optimal performance</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
