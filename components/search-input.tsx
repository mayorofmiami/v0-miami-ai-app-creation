"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from "react"
import XIcon from "@/components/icons/X"
import Settings from "@/components/icons/Settings"
import Paperclip from "@/components/icons/Paperclip"
import { ArrowRight, Sparkles, Zap } from "lucide-react"
import type { ModelId } from "@/components/model-selector"
import { SearchSuggestions } from "@/components/search-input/search-suggestions"
import { SearchInputMenu } from "@/components/search-input/search-input-menu"
import type { Attachment, User } from "@/types"

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
  mode?: "quick" | "deep"
  onModeChange?: (mode: "quick" | "deep") => void
  onCancel?: () => void
  recentSearches?: string[]
  user?: User
  selectedModel?: ModelId
  onModelChange?: (model: ModelId) => void
  onHistoryClick?: () => void
  contentType?: "search" | "image"
  onContentTypeChange?: (type: "search" | "image") => void
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
    hasHistory = false,
  },
  ref,
) {
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim() && !isLoading) {
        onSearch(query, mode || "quick", attachments.length > 0 ? attachments : undefined)
        setShowSuggestions(false)
        setIsFocused(false)
        setAttachments([]) // Clear attachments after search
        inputRef.current?.blur()
      }
    },
    [query, isLoading, onSearch, attachments, mode],
  )

  const handleFocus = useCallback(() => {
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
        onSearch(suggestions[selectedIndex], mode || "quick")
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
      onModeChange?.(newMode)
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

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion)
      onSearch(suggestion, mode || "quick")
      setShowSuggestions(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()
    },
    [onSearch, mode],
  )

  return (
    <div ref={wrapperRef} className="w-full max-w-4xl mx-auto relative px-4 md:px-0">
      <div
        className={`relative transition-all duration-500 ease-out ${
          isFocused
            ? "transform scale-[1.02]"
            : query.trim()
              ? "transform scale-100"
              : "transform scale-[0.98] opacity-90"
        }`}
      >
        {attachments.length > 0 && (
          <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
            {attachments.map((attachment, idx) => (
              <div
                key={attachment.id}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="group flex items-center gap-1.5 px-2.5 py-1 bg-background/80 backdrop-blur-xl border border-border/40 rounded-full hover:border-miami-aqua/60 transition-all duration-200 shadow-sm animate-in zoom-in-95"
              >
                {attachment.preview ? (
                  <div className="w-4 h-4 rounded-full overflow-hidden">
                    <img src={attachment.preview || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Paperclip className="w-3 h-3 text-foreground/60" />
                )}
                <span className="text-xs text-foreground/80 max-w-[80px] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="p-0.5 hover:bg-muted/60 rounded-full transition-colors"
                >
                  <XIcon className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div
            className={`absolute -inset-[1px] rounded-3xl transition-all duration-700 ${
              isFocused && query.trim()
                ? contentType === "image"
                  ? "bg-gradient-to-r from-miami-pink/20 via-miami-purple/20 to-miami-pink/20 animate-gradient blur-xl opacity-60"
                  : mode === "quick"
                    ? "bg-gradient-to-r from-miami-aqua/20 via-miami-blue/20 to-miami-aqua/20 animate-gradient blur-xl opacity-60"
                    : "bg-gradient-to-r from-miami-purple/20 via-miami-pink/20 to-miami-purple/20 animate-gradient blur-xl opacity-60"
                : "opacity-0"
            }`}
          />

          <div
            className={`relative bg-background/95 backdrop-blur-2xl border rounded-3xl transition-all duration-300 overflow-hidden ${
              isFocused ? "border-border/60 shadow-2xl shadow-black/5" : "border-border/20 shadow-lg"
            }`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-px transition-all duration-500 ${
                isFocused
                  ? contentType === "image"
                    ? "bg-gradient-to-r from-transparent via-miami-pink/40 to-transparent"
                    : mode === "quick"
                      ? "bg-gradient-to-r from-transparent via-miami-aqua/40 to-transparent"
                      : "bg-gradient-to-r from-transparent via-miami-purple/40 to-transparent"
                  : "opacity-0"
              }`}
            />

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex-shrink-0">
                {contentType === "image" ? (
                  <Sparkles
                    className={`w-5 h-5 transition-all duration-300 ${
                      isFocused ? "text-miami-pink" : "text-muted-foreground/40"
                    }`}
                  />
                ) : mode === "quick" ? (
                  <Zap
                    className={`w-5 h-5 transition-all duration-300 ${
                      isFocused ? "text-miami-aqua" : "text-muted-foreground/40"
                    }`}
                  />
                ) : (
                  <Sparkles
                    className={`w-5 h-5 transition-all duration-300 ${
                      isFocused ? "text-miami-purple" : "text-muted-foreground/40"
                    }`}
                  />
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={
                  contentType === "image"
                    ? "Imagine something beautiful..."
                    : mode === "quick"
                      ? "Ask me anything..."
                      : "Let's explore in depth..."
                }
                disabled={isLoading}
                className="flex-1 text-base md:text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground/30 disabled:opacity-50 text-foreground font-light"
              />

              <div className="flex items-center gap-1 flex-shrink-0">
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
                      className={`p-2.5 rounded-xl transition-all duration-200 ${
                        isUploading
                          ? "bg-muted/50"
                          : isFocused
                            ? "hover:bg-muted/60 text-foreground/60"
                            : "text-muted-foreground/30 hover:text-foreground/50"
                      }`}
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleMenuToggle}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isMenuOpen
                      ? "bg-muted text-foreground"
                      : isFocused
                        ? "hover:bg-muted/60 text-foreground/60"
                        : "text-muted-foreground/30 hover:text-foreground/50"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </button>

                {isLoading && onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground transition-all duration-200 font-medium text-sm"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm ${
                      query.trim()
                        ? contentType === "image"
                          ? "bg-gradient-to-r from-miami-pink to-miami-purple hover:shadow-lg hover:shadow-miami-pink/20 text-white hover:scale-105 active:scale-95"
                          : mode === "quick"
                            ? "bg-gradient-to-r from-miami-aqua to-miami-blue hover:shadow-lg hover:shadow-miami-aqua/20 text-miami-dark hover:scale-105 active:scale-95"
                            : "bg-gradient-to-r from-miami-purple to-miami-pink hover:shadow-lg hover:shadow-miami-purple/20 text-white hover:scale-105 active:scale-95"
                        : "bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
                    }`}
                  >
                    <span>{contentType === "image" ? "Create" : "Go"}</span>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform duration-300 ${query.trim() ? "group-hover:translate-x-0.5" : ""}`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {!isLoading && (mode || contentType === "image") && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-top-1 duration-500">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-xl border text-xs font-medium ${
                contentType === "image"
                  ? "bg-miami-pink/5 border-miami-pink/20 text-miami-pink"
                  : mode === "quick"
                    ? "bg-miami-aqua/5 border-miami-aqua/20 text-miami-aqua"
                    : "bg-miami-purple/5 border-miami-purple/20 text-miami-purple"
              }`}
            >
              {contentType === "image" ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>{user ? "50 daily generations" : "3 free trials"}</span>
                </>
              ) : mode === "quick" ? (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Quick mode · Instant answers</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Deep mode · Comprehensive</span>
                </>
              )}
              {attachments.length > 0 && <span>· {attachments.length} attached</span>}
            </div>
          </div>
        )}
      </div>

      {isMenuOpen && (
        <SearchInputMenu
          contentType={contentType}
          mode={mode}
          selectedModel={selectedModel}
          hasHistory={hasHistory}
          showModelSelection={!!onModelChange && !!user}
          onContentTypeChange={handleContentTypeChange}
          onModeChange={handleModeChangeCallback}
          onModelChange={handleModelChangeCallback}
          onHistoryClick={handleHistoryClickCallback}
        />
      )}

      {showSuggestions && query.length >= 2 && (
        <SearchSuggestions suggestions={suggestions} selectedIndex={selectedIndex} onSelect={handleSuggestionClick} />
      )}
    </div>
  )
})
