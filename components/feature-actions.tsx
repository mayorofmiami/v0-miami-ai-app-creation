"use client"

import { Sparkles, FileText, Hammer, SearchIcon, Zap, TrendingUp } from "lucide-react"

interface FeatureActionsProps {
  onActionClick: (query: string, mode: "quick" | "deep") => void
}

export function FeatureActions({ onActionClick }: FeatureActionsProps) {
  const actions = [
    {
      icon: Sparkles,
      label: "Deep Research",
      description: "Comprehensive analysis",
      query: "",
      mode: "deep" as const,
      gradient: "from-miami-pink/20 to-miami-purple/20",
      hoverGradient: "hover:from-miami-pink/30 hover:to-miami-purple/30",
      iconColor: "text-miami-pink",
    },
    {
      icon: FileText,
      label: "Write",
      description: "Create content",
      query: "Help me write ",
      mode: "quick" as const,
      gradient: "from-miami-aqua/20 to-miami-blue/20",
      hoverGradient: "hover:from-miami-aqua/30 hover:to-miami-blue/30",
      iconColor: "text-miami-aqua",
    },
    {
      icon: Hammer,
      label: "Build",
      description: "Technical solutions",
      query: "Help me build ",
      mode: "quick" as const,
      gradient: "from-miami-purple/20 to-miami-blue/20",
      hoverGradient: "hover:from-miami-purple/30 hover:to-miami-blue/30",
      iconColor: "text-miami-purple",
    },
    {
      icon: TrendingUp,
      label: "Analyze",
      description: "Data insights",
      query: "Analyze ",
      mode: "quick" as const,
      gradient: "from-miami-green/20 to-miami-aqua/20",
      hoverGradient: "hover:from-miami-green/30 hover:to-miami-aqua/30",
      iconColor: "text-miami-green",
    },
    {
      icon: SearchIcon,
      label: "Research",
      description: "Find information",
      query: "Research ",
      mode: "quick" as const,
      gradient: "from-miami-blue/20 to-miami-aqua/20",
      hoverGradient: "hover:from-miami-blue/30 hover:to-miami-aqua/30",
      iconColor: "text-miami-blue",
    },
    {
      icon: Zap,
      label: "Quick Answer",
      description: "Fast response",
      query: "",
      mode: "quick" as const,
      gradient: "from-miami-yellow/20 to-miami-orange/20",
      hoverGradient: "hover:from-miami-yellow/30 hover:to-miami-orange/30",
      iconColor: "text-miami-yellow",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <button
            key={index}
            onClick={() => {
              // For Deep Research, just trigger mode change without query
              if (action.mode === "deep" && !action.query) {
                onActionClick("", "deep")
              } else {
                onActionClick(action.query, action.mode)
              }
            }}
            className={`group relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} border-2 border-border/50 hover:border-${action.iconColor.replace("text-", "")}/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center ${action.iconColor} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <p
                  className={`text-base sm:text-lg font-semibold text-foreground group-hover:text-${action.iconColor.replace("text-", "")} transition-colors`}
                >
                  {action.label}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{action.description}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
