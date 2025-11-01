"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Check from "@/components/icons/Check"
import Sparkles from "@/components/icons/Sparkles"
import Zap from "@/components/icons/Zap"
import Brain from "@/components/icons/Brain"
import Feather from "@/components/icons/Feather"
import Flame from "@/components/icons/Flame"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type ModelId =
  | "auto"
  | "openai/gpt-4o-mini"
  | "openai/gpt-4o"
  | "anthropic/claude-3.5-sonnet"
  | "anthropic/claude-3.5-haiku"
  | "google/gemini-2.0-flash"
  | "groq/llama-3.1-8b"
  | "groq/llama-3.3-70b"

interface ModelOption {
  id: ModelId
  name: string
  description: string
  icon: React.ReactNode
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "auto",
    name: "Auto",
    description: "Let us choose the best model",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Complex analysis & research",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude Sonnet",
    description: "Long-form content & nuance",
    icon: <Feather className="h-4 w-4" />,
  },
  {
    id: "groq/llama-3.3-70b",
    name: "Llama 3.3 70B",
    description: "Fast & powerful reasoning",
    icon: <Flame className="h-4 w-4" />,
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini Flash",
    description: "Fast & cost-effective",
    icon: <Flame className="h-4 w-4" />,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast, general queries",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "groq/llama-3.1-8b",
    name: "Llama 3.1 8B",
    description: "Ultra-fast & affordable",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude Haiku",
    description: "Balanced speed & quality",
    icon: <Zap className="h-4 w-4" />,
  },
]

interface ModelSelectorProps {
  value: ModelId
  onChange: (value: ModelId) => void
  className?: string
}

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const selectedModel = MODEL_OPTIONS.find((m) => m.id === value) || MODEL_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:bg-accent/50",
            className,
          )}
        >
          {selectedModel.icon}
          <span className="text-sm font-medium">{selectedModel.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Select AI Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MODEL_OPTIONS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onChange(model.id)}
            className="flex items-start gap-3 py-3 cursor-pointer"
          >
            <div className="flex h-5 w-5 items-center justify-center">{model.icon}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{model.name}</span>
                {value === model.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">{model.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
