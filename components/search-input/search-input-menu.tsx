"use client"

import SearchIcon from "@/components/icons/Search"
import ImageIcon from "@/components/icons/Image"
import Sparkles from "@/components/icons/Sparkles"
import History from "@/components/icons/History"
import Paperclip from "@/components/icons/Paperclip"
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
  onFileUploadClick?: () => void
  isAuthenticated?: boolean
  isCouncilMode?: boolean
  onCouncilModeChange?: (enabled: boolean) => void
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
  onFileUploadClick,
  isAuthenticated = false,
  isCouncilMode = false,
  onCouncilModeChange,
}: SearchInputMenuProps) {
  const handleModeChange = (newMode: "quick" | "deep") => {
    if (isCouncilMode && onCouncilModeChange) {
      onCouncilModeChange(false)
    }
    onModeChange(newMode)
  }

  const handleContentTypeChange = (type: "search" | "image") => {
    if (type === "image" && isCouncilMode && onCouncilModeChange) {
      onCouncilModeChange(false)
    }
    onContentTypeChange(type)
  }

  return (
    <div className="w-56 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-2">
        <button
          onClick={() => handleContentTypeChange(contentType === "search" ? "image" : "search")}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm font-medium hover:bg-muted text-foreground"
        >
          {contentType === "search" ? (
            <>
              <ImageIcon className="w-4 h-4" />
              Create Image
            </>
          ) : (
            <>
              <SearchIcon className="w-4 h-4" />
              Search
            </>
          )}
        </button>
      </div>

      {onFileUploadClick && (
        <>
          <div className="h-px bg-border/50 mx-2" />
          <div className="p-2">
            <button
              onClick={onFileUploadClick}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm font-medium hover:bg-muted text-foreground"
            >
              <Paperclip className="w-4 h-4" />
              Attach File
            </button>
          </div>
        </>
      )}

      {contentType === "search" && onCouncilModeChange && (
        <>
          <div className="h-px bg-border/50 mx-2" />
          <div className="p-2">
            <button
              onClick={() => onCouncilModeChange(!isCouncilMode)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isCouncilMode
                  ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <span>🏛️</span>
              <span>The Council</span>
              {isCouncilMode && <div className="ml-auto w-2 h-2 rounded-full bg-purple-400" />}
            </button>
          </div>
        </>
      )}

      {contentType === "search" && isAuthenticated && (
        <>
          <div className="h-px bg-border/50 mx-2" />
          <div className="p-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => handleModeChange("quick")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all text-sm font-medium ${
                  mode === "quick" && !isCouncilMode
                    ? "bg-miami-aqua/20 text-miami-aqua"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                Quick
              </button>
              <button
                onClick={() => handleModeChange("deep")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all text-sm font-medium ${
                  mode === "deep" && !isCouncilMode
                    ? "bg-miami-pink/20 text-miami-pink"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Deep
              </button>
            </div>
          </div>
        </>
      )}

      {contentType === "search" && showModelSelection && isAuthenticated && (
        <>
          <div className="h-px bg-border/50 mx-2" />
          <div className="p-2 max-h-56 overflow-y-auto">
            {MODEL_OPTIONS.map((model) => (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all mb-1 last:mb-0 text-sm font-medium ${
                  selectedModel === model.id ? "bg-miami-aqua/20 text-miami-aqua" : "hover:bg-muted text-foreground"
                }`}
              >
                <span>{model.name}</span>
                {selectedModel === model.id && <div className="w-2 h-2 rounded-full bg-miami-aqua" />}
              </button>
            ))}
          </div>
        </>
      )}

      {hasHistory && onHistoryClick && (
        <>
          <div className="h-px bg-border/50 mx-2" />
          <div className="p-2">
            <button
              onClick={onHistoryClick}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted transition-all text-sm font-medium text-muted-foreground"
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </>
      )}
    </div>
  )
}
