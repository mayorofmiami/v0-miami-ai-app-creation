"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from "react"
import SearchIcon from "@/components/icons/Search"
import XIcon from "@/components/icons/X"
import ImageIcon from "@/components/icons/Image"
import Settings from "@/components/icons/Settings"
import Paperclip from "@/components/icons/Paperclip"
import type { ModelId } from "@/components/model-selector"
import { AttachmentList } from "@/components/search-input/attachment-list"
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
  const inputRef = useRef<HTMLTextAreaElement>(null) // Changed from HTMLInputElement to HTMLTextAreaElement
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
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto' // Reset height
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 160 // Max height in pixels (about 6 lines)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [query])

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
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (query.trim() && !isLoading) {
          handleSubmit(e as any)
        }
        return
      }

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
    [showSuggestions, suggestions, selectedIndex, query, isLoading, handleSubmit],
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

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click()
    setIsMenuOpen(false)
  }, [])

  return (
    <div ref={wrapperRef} className="w-full relative">
      {/* Rate limit messages - Only show for authenticated users */}
      {user && contentType === "image" && !isLoading && (
        <p className="text-sm text-muted-foreground text-center mb-3">
          50 images per day
        </p>
      )}
      {user && contentType === "search" && attachments.length > 0 && !isLoading && (
        <p className="text-sm text-muted-foreground text-center mb-3">
          {`${attachments.length} of 5 attachments • 50 per day`}
        </p>
      )}

      <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} />

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20 transition-all hover:border-white/30 hover:shadow-xl hover:shadow-black/30">
          <button
            type="button"
            onClick={handleMenuToggle}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-all flex-shrink-0"
            title="Options"
            aria-label="Open options menu"
          >
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={contentType === "image" ? "Describe Your Image" : "Ask anything..."}
            disabled={isLoading}
            rows={1}
            className={`flex-1 px-2 py-1 text-foreground bg-transparent
              transition-all outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-base
              relative z-10 resize-none overflow-y-auto border-0 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            } placeholder:text-muted-foreground/50`}
            style={{ 
              outline: "none", 
              boxShadow: "none", 
              border: "none",
              minHeight: "28px",
              maxHeight: "160px",
              lineHeight: "1.5"
            }}
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isLoading && onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                title="Cancel"
              >
                <XIcon className="w-4 h-4" />
              </button>
            ) : (
              query.trim() && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-1 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
                  title="Send"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              )
            )}
          </div>
        </div>
      </form>

      {isMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
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
            onFileUploadClick={handleFileUploadClick}
            isAuthenticated={!!user}
          />
        </div>
      )}

      {showSuggestions && query.length >= 2 && (
        <SearchSuggestions suggestions={suggestions} selectedIndex={selectedIndex} onSelect={handleSuggestionClick} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple={!!user}
      />
    </div>
  )
})
