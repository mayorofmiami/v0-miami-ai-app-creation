"use client"

import { useState } from "react"
import SearchIcon from "@/components/icons/Search"
import ImageIcon from "@/components/icons/Image"
import SparklesIcon from "@/components/icons/Sparkles"
import MicIcon from "@/components/icons/Mic"
import SettingsIcon from "@/components/icons/Settings"
import HistoryIcon from "@/components/icons/History"
import CheckIcon from "@/components/icons/Check"
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

interface FloatingActionMenuProps {
  contentType: "search" | "image"
  onContentTypeChange: (type: "search" | "image") => void
  mode: "quick" | "deep"
  onModeChange: (mode: "quick" | "deep") => void
  selectedModel: ModelId
  onModelChange: (model: ModelId) => void
  onVoiceSearch?: () => void
  onHistoryClick?: () => void
  isListening?: boolean
  hasHistory?: boolean
  user?: { id: string; email: string; name: string | null; role?: string } | null
}

export function FloatingActionMenu({
  contentType,
  onContentTypeChange,
  mode,
  onModeChange,
  selectedModel,
  onModelChange,
  onVoiceSearch,
  onHistoryClick,
  isListening,
  hasHistory,
  user,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative h-11 w-11 rounded-full transition-all duration-500 ease-out ${
          isOpen
            ? "bg-gradient-to-br from-miami-aqua to-miami-pink scale-95 shadow-2xl shadow-miami-aqua/30"
            : "bg-background/80 backdrop-blur-md hover:bg-background border border-border hover:border-miami-aqua/50 shadow-lg hover:shadow-xl hover:shadow-miami-aqua/10"
        }`}
        aria-label="Menu"
      >
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-miami-aqua/20 to-miami-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isOpen ? "opacity-100" : ""}`}
        />
        <SettingsIcon
          className={`w-5 h-5 mx-auto relative z-10 transition-all duration-500 ${isOpen ? "rotate-180 text-miami-dark" : "text-foreground group-hover:text-miami-aqua group-hover:rotate-90"}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute bottom-full right-0 mb-3 w-72 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
              {/* Mode Selection */}
              <div className="p-4 border-b border-border/50">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onContentTypeChange("search")
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      contentType === "search"
                        ? "bg-miami-aqua/10 text-miami-aqua border border-miami-aqua/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <SearchIcon className="w-4 h-4" />
                    Search
                  </button>
                  <button
                    onClick={() => {
                      onContentTypeChange("image")
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      contentType === "image"
                        ? "bg-miami-pink/10 text-miami-pink border border-miami-pink/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="p-2">
                <button
                  onClick={() => {
                    onModeChange(mode === "quick" ? "deep" : "quick")
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${mode === "deep" ? "bg-miami-pink/10" : "bg-muted"}`}>
                      <SparklesIcon
                        className={`w-4 h-4 ${mode === "deep" ? "text-miami-pink" : "text-muted-foreground"}`}
                      />
                    </div>
                    <span className="font-medium">Deep Research</span>
                  </div>
                  {mode === "deep" && (
                    <div className="w-5 h-5 rounded-full bg-miami-pink/10 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-miami-pink" />
                    </div>
                  )}
                </button>

                {onVoiceSearch && (
                  <button
                    onClick={() => {
                      onVoiceSearch()
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-muted/50 transition-colors group ${isListening ? "bg-red-500/10" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${isListening ? "bg-red-500/10 animate-pulse" : "bg-muted"}`}>
                        <MicIcon className={`w-4 h-4 ${isListening ? "text-red-500" : "text-muted-foreground"}`} />
                      </div>
                      <span className="font-medium">{isListening ? "Listening..." : "Voice Search"}</span>
                    </div>
                  </button>
                )}

                {onHistoryClick && hasHistory && (
                  <button
                    onClick={() => {
                      onHistoryClick()
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted">
                        <HistoryIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">History</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Model Selector */}
              {user && (
                <>
                  <div className="h-px bg-border/50 mx-2" />
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      AI Model
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {MODEL_OPTIONS.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            onModelChange(model.id)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            selectedModel === model.id ? "bg-miami-aqua/10 text-miami-aqua" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                          {selectedModel === model.id && (
                            <div className="w-5 h-5 rounded-full bg-miami-aqua/10 flex items-center justify-center flex-shrink-0">
                              <CheckIcon className="w-3 h-3 text-miami-aqua" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
