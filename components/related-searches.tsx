"use client"

import { useState, useEffect } from "react"

interface RelatedSearchesProps {
  query: string
  onSearchClick: (search: string) => void
  renderContentOnly?: boolean
}

export function RelatedSearches({ query, onSearchClick, renderContentOnly = false }: RelatedSearchesProps) {
  const [relatedSearches, setRelatedSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Generate related searches based on the query
    const generateRelated = () => {
      // Simple related search generation - in production you'd call an API
      const related = [`${query} examples`, `${query} tutorial`, `${query} best practices`, `how to ${query}`]
      setRelatedSearches(related)
      setIsLoading(false)
    }

    const timer = setTimeout(generateRelated, 500)
    return () => clearTimeout(timer)
  }, [query])

  if (isLoading) {
    return (
      <div className="space-y-2 px-4 md:px-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const content = (
    <div className="space-y-2 px-4 md:px-6">
      {relatedSearches.map((search, index) => (
        <button
          key={index}
          onClick={() => onSearchClick(search)}
          className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 text-sm font-medium text-foreground min-h-[44px] md:min-h-0"
        >
          {search}
        </button>
      ))}
    </div>
  )

  if (renderContentOnly) {
    return content
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-4 md:px-6">Related Searches</h3>
      {content}
    </div>
  )
}
