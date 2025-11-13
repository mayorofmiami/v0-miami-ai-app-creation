"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from "react"
import SearchIcon from "@/components/icons/Search"
import XIcon from "@/components/icons/X"
import ImageIcon from "@/components/icons/Image"
import Settings from "@/components/icons/Settings"
import Paperclip from "@/components/icons/Paperclip"
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
    <div ref={wrapperRef} className="w-full max-w-3xl mx-auto relative">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative bg-background/95 backdrop-blur-md rounded-full transition-all duration-200 ${
            isFocused
              ? "shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-border"
              : "shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border/50"
          }`}
        >
          {attachments.length > 0 && (
            <div className="absolute -top-12 left-0 right-0 px-2 pb-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group/chip flex items-center gap-1.5 pl-2 pr-1 py-1 bg-muted/80 backdrop-blur-sm rounded-full border border-border/40 hover:border-foreground/20 transition-all"
                  >
                    {attachment.preview ? (
                      <img
                        src={attachment.preview || "/placeholder.svg"}
                        alt={attachment.name}
                        className="w-5 h-5 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-muted-foreground/10 rounded-full flex items-center justify-center">
                        <Paperclip className="w-3 h-3 text-muted-foreground/60" />
                      </div>
                    )}
                    <span className="text-xs text-foreground/70 truncate max-w-[100px]">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="opacity-0 group-hover/chip:opacity-100 transition-opacity p-0.5 hover:bg-background rounded-full"
                      aria-label={`Remove ${attachment.name}`}
                    >
                      <XIcon className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pl-4 pr-2 py-3 md:py-3.5">
            <div className="flex-shrink-0">
              {contentType === "image" ? (
                <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
              ) : (
                <SearchIcon className="w-5 h-5 text-muted-foreground/60" />
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
              placeholder={contentType === "image" ? "Describe an image..." : "Ask anything..."}
              disabled={isLoading}
              className="flex-1 text-base bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleMenuToggle}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                title="Options"
                aria-label="Open options menu"
              >
                <Settings className="w-[18px] h-[18px]" />
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
                    aria-label="Upload files"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isLoading}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-40"
                    title={user ? "Attach files" : "Attach image"}
                    aria-label="Attach files"
                  >
                    {isUploading ? (
                      <div className="w-[18px] h-[18px] border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </>
              )}

              {isLoading && onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-2 rounded-full bg-muted/80 text-foreground hover:bg-muted transition-all active:scale-95"
                  title="Cancel"
                  aria-label="Cancel search"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className={`p-2 rounded-full transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                    query.trim()
                      ? contentType === "image"
                        ? "bg-gradient-to-br from-miami-pink to-miami-purple text-white shadow-sm"
                        : mode === "quick"
                          ? "bg-gradient-to-br from-miami-aqua to-miami-blue text-miami-dark shadow-sm"
                          : "bg-gradient-to-br from-miami-pink to-miami-purple text-white shadow-sm"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                  aria-label={contentType === "image" ? "Generate image" : "Search"}
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Dropdowns */}
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

      {contentType === "image" && !isLoading && (
        <p className="text-xs text-muted-foreground/60 text-center mt-2.5">
          {user ? "50 images per day" : "3 free images · Sign up for 50/day"}
        </p>
      )}
      {contentType === "search" && attachments.length > 0 && !isLoading && (
        <p className="text-xs text-muted-foreground/60 text-center mt-2.5">
          {user
            ? `${attachments.length}/5 attachments · 50 per day`
            : `${attachments.length}/1 attachment · 5 per day · Sign up for more`}
        </p>
      )}
    </div>
  )
})
