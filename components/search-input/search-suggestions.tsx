"use client"

import ClockIcon from "@/components/icons/Clock"

interface SearchSuggestionsProps {
  suggestions: string[]
  selectedIndex: number
  onSelect: (suggestion: string) => void
}

export function SearchSuggestions({ suggestions, selectedIndex, onSelect }: SearchSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault()
            onSelect(suggestion)
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
  )
}
