"use client"

import { Button } from "@/components/ui/button"

interface RelatedSearchesProps {
  searches: string[]
  onSelect: (search: string) => void
}

export function RelatedSearches({ searches, onSelect }: RelatedSearchesProps) {
  if (searches.length === 0) return null

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-base">✨</span>
        <span>Related searches</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((search, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(search)}
            className="text-sm hover:bg-miami-aqua/10 hover:border-miami-aqua hover:text-miami-aqua transition-all"
          >
            {search}
          </Button>
        ))}
      </div>
    </div>
  )
}
