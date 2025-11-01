"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"

interface RelatedSearchesProps {
  searches: string[]
  onSearchClick: (search: string) => void
}

export function RelatedSearches({ searches, onSearchClick }: RelatedSearchesProps) {
  const handleSearchClick = useCallback(
    (search: string) => {
      onSearchClick(search)
    },
    [onSearchClick],
  )

  if (!searches || searches.length === 0) return null

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Related Searches</h3>
      <div className="flex flex-wrap gap-2">
        {searches.map((search, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleSearchClick(search)}
            className="hover:bg-miami-aqua/10 hover:border-miami-aqua hover:shadow-lg hover:shadow-miami-aqua/20 transition-all duration-300 text-sm whitespace-normal text-left h-auto py-2 px-3"
          >
            {search}
          </Button>
        ))}
      </div>
    </div>
  )
}
