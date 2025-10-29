"use client"

import { Search, Sparkles, Frown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  type: "no-searches" | "no-bookmarks" | "no-results"
  onAction?: () => void
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const states = {
    "no-searches": {
      icon: <Search className="w-20 h-20 text-miami-aqua/50" />,
      title: "No searches yet",
      description: "Start your first search to see your history here",
      action: "Start Searching",
      gradient: "from-miami-aqua/20 to-miami-pink/20",
    },
    "no-bookmarks": {
      icon: <Sparkles className="w-20 h-20 text-miami-pink/50" />,
      title: "No bookmarks yet",
      description: "Bookmark your favorite searches to access them quickly",
      action: null,
      gradient: "from-miami-pink/20 to-miami-aqua/20",
    },
    "no-results": {
      icon: <Frown className="w-20 h-20 text-miami-aqua/50" />,
      title: "No results found",
      description: "Try adjusting your search query or try a different search mode",
      action: "New Search",
      gradient: "from-miami-aqua/20 to-miami-pink/20",
    },
  }

  const state = states[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-500">
      <div
        className={`mb-6 p-8 rounded-full bg-gradient-to-br ${state.gradient} backdrop-blur-sm border border-miami-aqua/20 animate-in zoom-in duration-700`}
      >
        {state.icon}
      </div>
      <h3 className="text-2xl font-bold mb-3 text-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {state.title}
      </h3>
      <p className="text-muted-foreground mb-8 max-w-md text-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        {state.description}
      </p>
      {state.action && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-miami-aqua to-miami-pink hover:opacity-90 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl hover:shadow-miami-aqua/20 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
        >
          {state.action}
        </Button>
      )}
    </div>
  )
}
