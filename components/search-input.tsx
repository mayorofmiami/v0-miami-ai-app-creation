"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from "react"
import SearchIcon from "@/components/icons/Search"
import XIcon from "@/components/icons/X"
import ClockIcon from "@/components/icons/Clock"
import ImageIcon from "@/components/icons/Image"
import Settings from "@/components/icons/Settings"
import Sparkles from "@/components/icons/Sparkles"
import History from "@/components/icons/History"
import Paperclip from "@/components/icons/Paperclip"
import X from "@/components/icons/X"
import type { ModelId, Attachment } from "@/components/model-selector"

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
  onSearch: (query: string, mode: "quick" | "deep", attachments?: Attachment[]) => void
  isLoading?: boolean
  mode: "quick" | "deep"
  onModeChange: (mode: "quick" | "deep") => void
  onCancel?: () => void
  recentSearches?: string[]
  user?: { id: string; email: string; name: string | null; role?: string } | null
  selectedModel?: ModelId
  onModelChange?: (model: ModelId) => void
  onHistoryClick?: () => void
  contentType?: "search" | "image"
  onContentTypeChange?: (type: "search" | "image") => void
  onVoiceSearch?: () => void
  hasHistory?: boolean
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
    contentType = "search",
    onContentTypeChange,
    onVoiceSearch,
    hasHistory = false,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    clear: () => {
      setQuery("")
      setShowSuggestions(false)
      setSelectedIndex(-1)
      setAttachments([])
    },
  }))

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

  const filteredSuggestions = useMemo(() => {
    if (query.length >= 2) {
      return recentSearches.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    }
    return []
  }, [query, recentSearches])

  useEffect(() => {
    setSuggestions(filteredSuggestions)
    setShowSuggestions(filteredSuggestions.length > 0)
  }, [filteredSuggestions])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only run if dropdowns are actually open
      if (!showSuggestions && !isMenuOpen) {
        return
      }

      const target = event.target as HTMLElement

      // Don't close if clicking on Sheet triggers or dialog elements
      if (
        target.closest("[data-sheet-trigger]") ||
        target.closest('[role="dialog"]') ||
        target.closest("[data-radix-dialog-overlay]") ||
        target.closest("[data-radix-dialog-content]") ||
        target.closest('button[aria-label="Open menu"]')
      ) {
        return
      }

      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setShowSuggestions(false)
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [showSuggestions, isMenuOpen])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim() && !isLoading) {
        onSearch(query, mode, attachments.length > 0 ? attachments : undefined)
        setShowSuggestions(false)
        setIsFocused(false)
        setAttachments([]) // Clear attachments after search
        inputRef.current?.blur()
      }
    },
    [query, isLoading, onSearch, mode, attachments],
  )

  const handleFocus = useCallback(() => {
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
  }, [])

  const handleBlur = useCallback(() => {
    console.log("[v0] handleBlur called")
    setIsFocused(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [showSuggestions, suggestions, selectedIndex, onSearch, mode],
  )

  const handleVoiceSearch = useCallback(() => {
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
  }, [recognition, isListening])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion)
      onSearch(suggestion, mode)
      setShowSuggestions(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()
    },
    [onSearch, mode],
  )

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen((prev) => !prev)
  }, [])

  const handleContentTypeChange = useCallback(
    (type: "search" | "image") => {
      onContentTypeChange?.(type)
      setIsMenuOpen(false)
    },
    [onContentTypeChange],
  )

  const handleModeChangeCallback = useCallback(
    (newMode: "quick" | "deep") => {
      onModeChange(newMode)
      setIsMenuOpen(false)
    },
    [onModeChange],
  )

  const handleModelChangeCallback = useCallback(
    (model: ModelId) => {
      onModelChange?.(model)
      setIsMenuOpen(false)
    },
    [onModelChange],
  )

  const handleHistoryClickCallback = useCallback(() => {
    onHistoryClick?.()
    setIsMenuOpen(false)
  }, [onHistoryClick])

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      // Check attachment limit based on auth status
      const maxAttachments = user ? 5 : 1
      if (attachments.length + files.length > maxAttachments) {
        alert(`Maximum ${maxAttachments} attachment${maxAttachments > 1 ? "s" : ""} allowed`)
        return
      }

      setIsUploading(true)

      try {
        for (const file of files) {
          const formData = new FormData()
          formData.append("file", file)
          if (user?.id) {
            formData.append("userId", user.id)
          }

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!res.ok) {
            const error = await res.json()
            alert(error.error || "Upload failed")
            continue
          }

          const data = await res.json()

          const attachment: Attachment = {
            id: Math.random().toString(36).substring(7),
            name: data.filename,
            type: data.type,
            size: data.size,
            url: data.url,
            blobUrl: data.url,
            preview: data.type.startsWith("image/") ? data.url : undefined,
          }

          setAttachments((prev) => [...prev, attachment])
        }
      } catch (error) {
        console.error("Upload error:", error)
        alert("Failed to upload file")
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    },
    [attachments.length, user],
  )

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return (
    <div ref={wrapperRef} className="w-full max-w-3xl mx-auto relative">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border"
            >
              {attachment.preview ? (
                <img
                  src={attachment.preview || "/placeholder.svg"}
                  alt={attachment.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-muted-foreground/10 rounded flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(attachment.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

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
            placeholder={contentType === "image" ? "Describe the image you want to generate..." : "Ask anything..."}
            disabled={isLoading}
            className={`w-full px-6 py-5 pr-32 text-foreground rounded-xl border-2 ${
              contentType === "image"
                ? "border-miami-pink"
                : mode === "quick"
                  ? "border-miami-aqua"
                  : "border-miami-pink"
            } transition-all focus:outline-none focus:ring-0 text-lg bg-background/50 backdrop-blur-sm relative z-10 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            } placeholder:text-muted-foreground/60`}
          />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20">
          {/* Settings Menu Button */}
          <button
            type="button"
            onClick={handleMenuToggle}
            className="p-3 rounded-lg bg-background/80 hover:bg-muted transition-all border border-border/50 hover:border-miami-aqua/50"
            title="Options"
          >
            <Settings className="w-5 h-5 text-muted-foreground hover:text-miami-aqua transition-colors" />
          </button>

          {contentType === "search" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={user ? "image/*,.pdf,.txt,.csv" : "image/*"}
                multiple={!!user}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isLoading}
                className="p-3 rounded-lg bg-background/80 hover:bg-muted transition-all border border-border/50 hover:border-miami-aqua/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={user ? "Attach files (images, PDFs, documents)" : "Attach image"}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-miami-aqua border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5 text-muted-foreground hover:text-miami-aqua transition-colors" />
                )}
              </button>
            </>
          )}

          {/* Submit Button */}
          {isLoading && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="p-3.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
              title="Cancel"
            >
              <XIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className={`p-3.5 rounded-lg transition-all ${
                contentType === "image"
                  ? "bg-miami-pink hover:bg-miami-pink/80"
                  : mode === "quick"
                    ? "bg-miami-aqua hover:bg-miami-aqua/80"
                    : "bg-miami-pink hover:bg-miami-pink/80"
              } text-miami-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              {contentType === "image" ? <ImageIcon className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
      </form>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 bottom-full mb-2 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Content Type Selection */}
          <div className="p-1.5">
            <div className="flex gap-1">
              <button
                onClick={() => handleContentTypeChange("search")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all text-xs font-medium ${
                  contentType === "search"
                    ? "bg-miami-aqua/20 text-miami-aqua"
                    : "hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <SearchIcon className="w-3.5 h-3.5" />
                Search
              </button>
              <button
                onClick={() => handleContentTypeChange("image")}
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
                    onClick={() => handleModeChangeCallback("quick")}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all mb-0.5 last:mb-0 ${
                      mode === "quick" ? "bg-miami-aqua/20 text-miami-aqua" : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    Quick
                  </button>
                  <button
                    onClick={() => handleModeChangeCallback("deep")}
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
          {contentType === "search" && onModelChange && user && (
            <>
              <div className="h-px bg-border/30 mx-1.5" />
              <div className="p-1.5 max-h-48 overflow-y-auto">
                {MODEL_OPTIONS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChangeCallback(model.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all mb-0.5 last:mb-0 ${
                      selectedModel === model.id
                        ? "bg-miami-aqua/20 text-miami-aqua"
                        : "hover:bg-muted/50 text-foreground"
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
                  onClick={handleHistoryClickCallback}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-all text-xs font-medium text-muted-foreground"
                >
                  <History className="w-3.5 h-3.5" />
                  History
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                handleSuggestionClick(suggestion)
              }}
              className={`w-full px-5 py-4 text-left flex items-center gap-3 transition-colors ${
                index === selectedIndex ? "bg-miami-aqua/10" : "hover:bg-muted"
              }`}
            >
              <ClockIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-base break-all">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Rate limit messages */}
      {contentType === "image" && !isLoading && (
        <p className="text-sm text-muted-foreground text-center mt-3">
          {user ? "50 images per day" : "3 free images per day • Sign up for 50/day"}
        </p>
      )}
      {contentType === "search" && mode === "deep" && !isLoading && (
        <p className="text-sm text-muted-foreground text-center mt-3">
          Deep Research mode may take 30-60 seconds for comprehensive results
        </p>
      )}
      {contentType === "search" && attachments.length > 0 && !isLoading && (
        <p className="text-sm text-muted-foreground text-center mt-3">
          {user
            ? `${attachments.length} of 5 attachments • 50 per day`
            : `${attachments.length} of 1 attachment • 5 per day • Sign up for more`}
        </p>
      )}
    </div>
  )
})
