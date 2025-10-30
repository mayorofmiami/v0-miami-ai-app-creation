"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Search, Sparkles, X, Clock, Mic, MicOff, Settings2, Check, History } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface SearchInputProps {
  onSearch: (query: string, mode: "quick" | "deep") => void
  isLoading?: boolean
  mode: "quick" | "deep"
  onModeChange: (mode: "quick" | "deep") => void
  onCancel?: () => void
  recentSearches?: string[]
  user?: { id: string; email: string; name: string | null; role?: string } | null
  selectedModel?: ModelId
  onModelChange?: (model: ModelId) => void
  onHistoryClick?: () => void
}

export interface SearchInputRef {
  focus: () => void
  clear: () => void
}

export const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(function SearchInput(
  {
    onSearch,
    isLoading,
    mode,
    onModeChange,
    onCancel,
    recentSearches = [],
    user,
    selectedModel = "auto",
    onModelChange,
    onHistoryClick,
  },
  ref,
) {
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    clear: () => {
      setQuery("")
      setShowSuggestions(false)
      setSelectedIndex(-1)
    },
  }))

  useEffect(() => {
    if (typeof ref === "function") {
      ref(inputRef.current)
    } else if (ref) {
      ref.current = inputRef.current
    }
  }, [ref])

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "en-US"

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        setIsListening(false)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      const filtered = recentSearches.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, recentSearches])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        console.log("[v0] Click outside detected")
        setShowSuggestions(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSearch(query, mode)
      setShowSuggestions(false)
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  const handleFocus = () => {
    console.log("[v0] handleFocus called")
    setIsFocused(true)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }
    }, 300)
  }

  const handleBlur = () => {
    console.log("[v0] handleBlur called")
    setIsFocused(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      setQuery(suggestions[selectedIndex])
      onSearch(suggestions[selectedIndex], mode)
      setShowSuggestions(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleVoiceSearch = () => {
    if (!recognition) {
      alert("Voice search is not supported in your browser")
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  return (
    <div ref={wrapperRef} className="w-full max-w-3xl mx-auto relative">
      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.4),
                        0 0 40px rgba(0, 212, 255, 0.2),
                        inset 0 0 20px rgba(0, 212, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.6),
                        0 0 60px rgba(0, 212, 255, 0.3),
                        inset 0 0 30px rgba(0, 212, 255, 0.15);
          }
        }
        
        @keyframes glow-pulse-pink {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 0, 110, 0.4),
                        0 0 40px rgba(255, 0, 110, 0.2),
                        inset 0 0 20px rgba(255, 0, 110, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 0, 110, 0.6),
                        0 0 60px rgba(255, 0, 110, 0.3),
                        inset 0 0 30px rgba(255, 0, 110, 0.15);
          }
        }
        
        .glow-pulse-aqua {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .glow-pulse-pink {
          animation: glow-pulse-pink 2s ease-in-out infinite;
        }
      `}</style>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            className={`w-full px-6 py-5 pr-48 text-foreground rounded-xl border-2 ${
              mode === "quick" ? "border-miami-aqua glow-pulse-aqua" : "border-miami-pink glow-pulse-pink"
            } transition-all focus:outline-none focus:ring-0 text-lg bg-background/50 backdrop-blur-sm relative z-10 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            } placeholder:text-muted-foreground/60`}
          />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
          {isListening && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="p-3.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
              title="Cancel search"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <>
              {onHistoryClick && recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={onHistoryClick}
                  disabled={isLoading}
                  className="p-3.5 rounded-lg transition-all bg-muted text-muted-foreground hover:bg-miami-aqua/20 hover:text-miami-aqua disabled:opacity-50 disabled:cursor-not-allowed"
                  title="View search history"
                >
                  <History className="w-5 h-5" />
                </button>
              )}

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                disabled={isLoading}
                className={`p-3.5 rounded-lg transition-all ${
                  isListening
                    ? "bg-red-500/20 text-red-500 animate-pulse"
                    : "bg-muted text-muted-foreground hover:bg-miami-aqua/20 hover:text-miami-aqua"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? "Stop listening" : "Voice search"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isLoading}
                      className={`p-3.5 rounded-lg transition-all ${
                        mode === "deep"
                          ? "bg-miami-pink text-miami-dark neon-border-pink"
                          : "bg-muted text-muted-foreground hover:bg-miami-aqua/20 hover:text-miami-aqua"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Search Options"
                    >
                      <Settings2 className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel className="text-sm font-normal text-muted-foreground px-3 py-2">
                      Search Options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Deep Research Toggle */}
                    <DropdownMenuItem
                      onClick={() => onModeChange(mode === "quick" ? "deep" : "quick")}
                      className="flex items-start gap-3 py-4 px-3 cursor-pointer"
                    >
                      <div className="flex h-6 w-6 items-center justify-center">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-medium">Deep Research</span>
                          {mode === "deep" && <Check className="h-5 w-5 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {mode === "deep" ? "Active - Comprehensive analysis" : "Enable for detailed research"}
                        </p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-sm font-normal text-muted-foreground px-3 py-2">
                      AI Model
                    </DropdownMenuLabel>

                    {/* Model Options */}
                    {MODEL_OPTIONS.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange?.(model.id)}
                        className="flex items-start gap-3 py-4 px-3 cursor-pointer"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-medium">{model.name}</span>
                            {selectedModel === model.id && <Check className="h-5 w-5 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  type="button"
                  onClick={() => onModeChange(mode === "quick" ? "deep" : "quick")}
                  disabled={isLoading}
                  className={`p-3.5 rounded-lg transition-all ${
                    mode === "deep"
                      ? "bg-miami-pink text-miami-dark neon-border-pink"
                      : "bg-muted text-muted-foreground hover:bg-miami-aqua/20 hover:text-miami-aqua"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={mode === "deep" ? "Deep Research Mode (Active)" : "Enable Deep Research"}
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`p-3.5 rounded-lg transition-all ${
              mode === "quick" ? "bg-miami-aqua hover:bg-miami-aqua/80" : "bg-miami-pink hover:bg-miami-pink/80"
            } text-miami-dark disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                setQuery(suggestion)
                onSearch(suggestion, mode)
                setShowSuggestions(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
              }}
              className={`w-full px-5 py-4 text-left flex items-center gap-3 transition-colors ${
                index === selectedIndex ? "bg-miami-aqua/10" : "hover:bg-muted"
              }`}
            >
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-base break-all">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {mode === "deep" && !isLoading && (
        <p className="text-sm text-muted-foreground text-center mt-3">
          Deep Research mode may take 30-60 seconds for comprehensive results
        </p>
      )}
    </div>
  )
})
