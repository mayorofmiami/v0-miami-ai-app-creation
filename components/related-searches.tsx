"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import Search from "@/components/icons/Search"

interface RelatedSearchesProps {
  searches: string[]
  onSearchClick: (search: string) => void
}

export function RelatedSearches({ searches, onSearchClick }: RelatedSearchesProps) {
  const [showAll, setShowAll] = useState(false)

  const handleSearchClick = useCallback(
    (search: string) => {
      onSearchClick(search)
    },
    [onSearchClick],
  )

  if (!searches || searches.length === 0) return null

  const visibleSearches = showAll ? searches : searches.slice(0, 4)
  const hasMore = searches.length > 4

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <h3 className="text-base md:text-lg font-semibold text-foreground/80 px-1">Related Searches</h3>

      <div className="flex flex-col md:flex-row md:flex-wrap gap-2.5 md:gap-2">
        {visibleSearches.map((search, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => handleSearchClick(search)}
            className="group relative h-auto min-h-[52px] md:min-h-0 py-3 md:py-2 px-4 md:px-3 
                       text-left justify-start items-center gap-2.5 md:gap-2
                       border-border/50 hover:border-miami-aqua/50 
                       bg-background/50 hover:bg-miami-aqua/5 
                       transition-all duration-300 
                       hover:shadow-md hover:shadow-miami-aqua/10 
                       hover:scale-[1.02] active:scale-95
                       rounded-xl md:rounded-lg
                       text-sm md:text-sm font-medium
                       overflow-hidden
                       w-full md:w-auto"
          >
            <Search
              size={16}
              className="flex-shrink-0 text-miami-aqua/60 group-hover:text-miami-aqua transition-colors"
            />

            <span className="flex-1 text-foreground/80 group-hover:text-miami-aqua transition-colors leading-snug md:line-clamp-1 whitespace-normal break-words">
              {search}
            </span>
          </Button>
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="md:hidden w-full py-3 px-4 rounded-xl border border-miami-aqua/30 
                     bg-miami-aqua/5 hover:bg-miami-aqua/10 
                     text-sm font-medium text-miami-aqua 
                     transition-all duration-300 
                     hover:shadow-md hover:shadow-miami-aqua/10
                     active:scale-95"
        >
          Show {searches.length - 4} more
        </button>
      )}
    </div>
  )
}
