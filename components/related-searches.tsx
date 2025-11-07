"use client"

import { useCallback, useState, memo } from "react"
import { Button } from "@/components/ui/button"
import Search from "@/components/icons/Search"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"

interface RelatedSearchesProps {
  query: string
  onSearchClick: (search: string) => void
}

export const RelatedSearches = memo(function RelatedSearches({ query, onSearchClick }: RelatedSearchesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searches, setSearches] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchRelatedSearches = useCallback(async () => {
    if (searches.length > 0) {
      // Already fetched, just toggle
      setIsExpanded(!isExpanded)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/generate-related-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) {
        throw new Error("Failed to generate related searches")
      }

      const data = await res.json()
      setSearches(data.searches || [])
      setIsExpanded(true)
    } catch (err) {
      console.error("Error fetching related searches:", err)
      setError("Failed to load suggestions")
    } finally {
      setIsLoading(false)
    }
  }, [query, searches.length, isExpanded])

  const handleSearchClick = useCallback(
    (search: string) => {
      onSearchClick(search)
    },
    [onSearchClick],
  )

  const toggleExpanded = () => {
    if (searches.length > 0) {
      setIsExpanded(!isExpanded)
    } else {
      fetchRelatedSearches()
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <button
        onClick={toggleExpanded}
        disabled={isLoading}
        className="w-full flex items-center justify-between gap-3 
                   px-4 py-3 rounded-xl
                   border border-border/50 hover:border-miami-aqua/30
                   bg-background/50 hover:bg-miami-aqua/5
                   transition-all duration-200
                   group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2.5">
          <Search size={18} className="text-miami-aqua/70 group-hover:text-miami-aqua transition-colors" />
          <span className="text-sm md:text-base font-medium text-foreground/80 group-hover:text-miami-aqua transition-colors">
            Related Searches
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <Loader2 size={16} className="animate-spin text-miami-aqua" />}
          {!isLoading &&
            (isExpanded ? (
              <ChevronUp size={18} className="text-miami-aqua/70 group-hover:text-miami-aqua transition-colors" />
            ) : (
              <ChevronDown size={18} className="text-miami-aqua/70 group-hover:text-miami-aqua transition-colors" />
            ))}
        </div>
      </button>

      {isExpanded && searches.length > 0 && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {searches.map((search, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleSearchClick(search)}
              className="group relative h-auto min-h-[52px] md:min-h-0 py-3 md:py-2.5 px-4 md:px-3.5
                       text-left justify-start items-center gap-2.5 md:gap-2
                       border-border/40 hover:border-miami-aqua/50 
                       bg-background/30 hover:bg-miami-aqua/5 
                       transition-all duration-300 
                       hover:shadow-md hover:shadow-miami-aqua/10 
                       hover:scale-[1.01] active:scale-95
                       rounded-lg
                       text-sm md:text-sm font-medium
                       overflow-hidden
                       w-full"
            >
              <Search
                size={15}
                className="flex-shrink-0 text-miami-aqua/50 group-hover:text-miami-aqua transition-colors"
              />

              <span className="flex-1 text-foreground/75 group-hover:text-miami-aqua transition-colors leading-snug whitespace-normal break-words">
                {search}
              </span>
            </Button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
})
