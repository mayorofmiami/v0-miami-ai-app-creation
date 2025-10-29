"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef } from "react"
import { Search, Sparkles, X, Clock, Mic, MicOff } from "lucide-react"

interface SearchInputProps {
  onSearch: (query: string, mode: "quick" | "deep") => void
  isLoading?: boolean
  mode: "quick" | "deep"
  onModeChange: (mode: "quick" | "deep") => void
  onCancel?: () => void
  recentSearches?: string[]
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { onSearch, isLoading, mode, onModeChange, onCancel, recentSearches = [] },
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
    } else if (query.length === 0 && isFocused && recentSearches.length > 0) {
      setSuggestions(recentSearches.slice(0, 5))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, recentSearches, isFocused])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSearch(query, mode)
      setShowSuggestions(false)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }

    setTimeout(() => {
      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }
    }, 300)
  }

  const handleBlur = () => {
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
            ref={ref}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            className={`w-full px-6 py-4 pr-44 text-foreground rounded-xl border-2 ${
              mode === "quick" ? "border-miami-aqua glow-pulse-aqua" : "border-miami-pink glow-pulse-pink"
            } transition-all focus:outline-none focus:ring-0 text-lg bg-background/50 backdrop-blur-sm relative z-10 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
          {isListening && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="p-3 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
              title="Cancel search"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <>
              {/* Voice Search Button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                disabled={isLoading}
                className={`p-3 rounded-lg transition-all ${
                  isListening
                    ? "bg-red-500/20 text-red-500 animate-pulse"
                    : "bg-muted text-muted-foreground hover:bg-miami-aqua/20 hover:text-miami-aqua"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? "Stop listening" : "Voice search"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Deep Research Toggle */}
              <button
                type="button"
                onClick={() => onModeChange(mode === "quick" ? "deep" : "quick")}
                disabled={isLoading}
                className={`p-3 rounded-lg transition-all ${
                  mode === "deep"
                    ? "bg-miami-pink text-miami-dark neon-border-pink"
                    : "bg-muted text-muted-foreground hover:bg-miami-pink/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={mode === "deep" ? "Deep Research Mode (Active)" : "Enable Deep Research"}
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`p-3 rounded-lg transition-all ${
              mode === "quick" ? "bg-miami-aqua hover:bg-miami-aqua/80" : "bg-miami-pink hover:bg-miami-pink/80"
            } text-miami-dark disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(suggestion)
                onSearch(suggestion, mode)
                setShowSuggestions(false)
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                index === selectedIndex ? "bg-miami-aqua/10" : "hover:bg-muted"
              }`}
            >
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm break-all">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {mode === "deep" && !isLoading && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Deep Research mode may take 30-60 seconds for comprehensive results
        </p>
      )}
    </div>
  )
})
