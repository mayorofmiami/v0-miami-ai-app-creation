"use client"

import SearchIcon from "@/components/icons/Search"
import ImageIcon from "@/components/icons/Image"
import Sparkles from "@/components/icons/Sparkles"
import History from "@/components/icons/History"
import type { ModelId } from "@/components/model-selector"

const MODEL_OPTIONS = [
  { id: "auto" as ModelId, name: "Auto", description: "Let us choose" },
  { id: "openai/gpt-4o" as ModelId, name: "GPT-4o", description: "Complex analysis" },
  { id: "anthropic/claude-3.5-sonnet" as ModelId, name: "Claude Sonnet", description: "Long-form content" },
  { id: "groq/llama-3.3-70b" as ModelId, name: "Llama 3.3 70B", description: "Fast reasoning" },
  { id: "google/gemini-2.0-flash" as ModelId, name: "Gemini Flash", description: "Fast & affordable" },
  { id: "openai/gpt-4o-mini" as ModelId, name: "GPT-4o Mini", description: "Fast queries" },
  { id: "groq/llama-3.1-8b" as ModelId, name: "Llama 3.1 8B", description: "Ultra-fast" },
  { id: "anthropic/claude-3.5-haiku" as ModelId, name: "Claude Haiku", description: "Balanced" },
]

interface SearchInputMenuProps {
  contentType: "search" | "image"
  mode: "quick" | "deep"
  selectedModel: ModelId
  hasHistory: boolean
  showModelSelection: boolean
  onContentTypeChange: (type: "search" | "image") => void
  onModeChange: (mode: "quick" | "deep") => void
  onModelChange: (model: ModelId) => void
  onHistoryClick?: () => void
}

export function SearchInputMenu({
  contentType,
  mode,
  selectedModel,
  hasHistory,
  showModelSelection,
  onContentTypeChange,
  onModeChange,
  onModelChange,
  onHistoryClick,
}: SearchInputMenuProps) {
  return (
    <div className="absolute right-0 bottom-full mb-2 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Content Type Selection */}
      <div className="p-1.5">
        <div className="flex gap-1">
          <button
            onClick={() => onContentTypeChange("search")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all text-xs font-medium ${
              contentType === "search" ? "bg-miami-aqua/20 text-miami-aqua" : "hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Search
          </button>
          <button
            onClick={() => onContentTypeChange("image")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all text-xs font-medium ${
              contentType === "image" ? "bg-miami-pink/20 text-miami-pink" : "hover:bg-muted/50 text-foreground"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image
          </button>
        </div>
      </div>

      {/* Search Mode (only show for search content type) */}
      {contentType === "search" && (
        <>
          <div className="h-px bg-border/30 mx-1.5" />
          <div className="p-1.5">
            <div className="flex gap-1">
              <button
                onClick={() => onModeChange("quick")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all mb-0.5 last:mb-0 ${
                  mode === "quick" ? "bg-miami-aqua/20 text-miami-aqua" : "hover:bg-muted/50 text-foreground"
                }`}
              >
                Quick
              </button>
              <button
                onClick={() => onModeChange("deep")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all mb-0.5 last:mb-0 ${
                  mode === "deep" ? "bg-miami-pink/20 text-miami-pink" : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Deep
              </button>
            </div>
          </div>
        </>
      )}

      {/* Model Selection (only show for search content type and authenticated users) */}
      {contentType === "search" && showModelSelection && (
        <>
          <div className="h-px bg-border/30 mx-1.5" />
          <div className="p-1.5 max-h-48 overflow-y-auto">
            {MODEL_OPTIONS.map((model) => (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all mb-0.5 last:mb-0 ${
                  selectedModel === model.id ? "bg-miami-aqua/20 text-miami-aqua" : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <span className="text-xs font-medium">{model.name}</span>
                {selectedModel === model.id && <div className="w-1.5 h-1.5 rounded-full bg-miami-aqua" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* History Button */}
      {hasHistory && onHistoryClick && (
        <>
          <div className="h-px bg-border/30 mx-1.5" />
          <div className="p-1.5">
            <button
              onClick={onHistoryClick}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-all text-xs font-medium text-muted-foreground"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
        </>
      )}
    </div>
  )
}
