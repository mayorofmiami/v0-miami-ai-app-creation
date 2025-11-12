"use client"
import { useCallback, useState, memo } from "react"
import { Button } from "@/components/ui/button"
import Search from "@/components/icons/Search"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"

interface RelatedSearchesProps {
  query: string
  onSearchClick: (search: string) => void
  renderButtonOnly?: boolean
  renderContentOnly?: boolean
}

export const RelatedSearches = memo(function RelatedSearches({
  query,
  onSearchClick,
  renderButtonOnly = false,
  renderContentOnly = false,
}: RelatedSearchesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searches, setSearches] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchRelatedSearches = useCallback(async () => {
    if (searches.length > 0) {
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

  const getContent = useCallback(() => {
    if (!isExpanded || searches.length === 0) return null

    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {searches.map((search, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={() => handleSearchClick(search)}
              className="h-auto py-2 px-3.5
                       text-sm font-normal
                       rounded-lg
                       border border-border
                       hover:bg-muted/50 hover:border-miami-aqua/50
                       transition-all duration-200
                       text-foreground/80 hover:text-foreground
                       whitespace-normal break-words
                       max-w-full"
            >
              {search}
            </Button>
          ))}
        </div>
        {error && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    )
  }, [isExpanded, searches, error, handleSearchClick])

  const toggleExpanded = () => {
    if (searches.length > 0) {
      setIsExpanded(!isExpanded)
    } else {
      fetchRelatedSearches()
    }
  }

  if (renderButtonOnly) {
    return (
      <button
        onClick={toggleExpanded}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        aria-expanded={isExpanded}
      >
        <Search size={14} />
        <span>Related</span>
        {isLoading && <Loader2 size={14} className="animate-spin" />}
        {!isLoading && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>
    )
  }

  if (renderContentOnly) {
    if (searches.length === 0 && !isLoading && !error) {
      fetchRelatedSearches()
    }

    if (isLoading) {
      return (
        <div className="grid gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin mr-2" />
            Loading related searches...
          </div>
        </div>
      )
    }

    if (searches.length === 0) return null

    return (
      <div className="grid gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300 w-full max-w-full">
        {searches.map((search, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={() => handleSearchClick(search)}
            className="h-auto py-2 px-3.5 justify-start text-left
                     text-sm font-normal
                     rounded-lg
                     border border-border
                     hover:bg-muted/50 hover:border-miami-aqua/50
                     transition-all duration-200
                     text-foreground/80 hover:text-foreground
                     w-full max-w-full
                     whitespace-normal break-words"
          >
            {search}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-t border-border/30 pt-4">
        <div className="flex-shrink-0" />

        <button
          onClick={toggleExpanded}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          aria-expanded={isExpanded}
        >
          <Search size={14} />
          <span>Related</span>
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {!isLoading && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </button>
      </div>

      {getContent()}
    </div>
  )
})

export const RelatedSearchesInline = memo(function RelatedSearchesInline({
  query,
  onSearchClick,
  isVisible = true, // Added isVisible prop to control rendering
}: RelatedSearchesProps & { isVisible?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searches, setSearches] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchRelatedSearches = useCallback(async () => {
    if (searches.length > 0) {
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

  if (!isVisible) {
    return null
  }

  return (
    <>
      <button
        onClick={toggleExpanded}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        aria-expanded={isExpanded}
      >
        <Search size={14} />
        <span>Related</span>
        {isLoading && <Loader2 size={14} className="animate-spin" />}
        {!isLoading && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>

      {isExpanded && searches.length > 0 && (
        <div
          className="col-span-full w-full pt-4"
          style={{
            gridColumn: "1 / -1",
          }}
        >
          <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {searches.map((search, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => handleSearchClick(search)}
                className="h-auto py-2 px-3.5 justify-start text-left
                         text-sm font-normal
                         rounded-lg
                         border border-border
                         hover:bg-muted/50 hover:border-miami-aqua/50
                         transition-all duration-200
                         text-foreground/80 hover:text-foreground
                         w-full max-w-full
                         whitespace-normal break-words"
              >
                {search}
              </Button>
            ))}
          </div>

          {error && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}
    </>
  )
})
