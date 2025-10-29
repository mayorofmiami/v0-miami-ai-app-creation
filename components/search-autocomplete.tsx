"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Clock } from "lucide-react"

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: string) => void
  recentSearches?: string[]
}

export function SearchAutocomplete({ value, onChange, onSelect, recentSearches = [] }: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length >= 2) {
      // Combine recent searches and autocomplete suggestions
      const filtered = recentSearches.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 3)

      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions(recentSearches.slice(0, 5))
      setShowSuggestions(value.length === 0 && recentSearches.length > 0)
    }
  }, [value, recentSearches])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
      onSelect(suggestions[selectedIndex])
      setShowSuggestions(false)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        onKeyDown={handleKeyDown}
        className="w-full"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                onSelect(suggestion)
                setShowSuggestions(false)
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                index === selectedIndex ? "bg-miami-aqua/10" : "hover:bg-muted"
              }`}
            >
              {value.length === 0 ? (
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-sm">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
