"use client"

import { Button } from "@/components/ui/button"

interface RelatedSearchesProps {
  searches: string[]
  onSelect: (search: string) => void
}

function categorizeSearch(search: string): { category: string; icon: string; color: string } {
  const lower = search.toLowerCase()

  if (lower.includes("startup") || lower.includes("funding") || lower.includes("tech") || lower.includes("ai")) {
    return { category: "Business & Tech", icon: "🚀", color: "miami-aqua" }
  }
  if (
    lower.includes("real estate") ||
    lower.includes("housing") ||
    lower.includes("property") ||
    lower.includes("rent")
  ) {
    return { category: "Real Estate", icon: "🏠", color: "miami-coral" }
  }
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("dining") || lower.includes("cafe")) {
    return { category: "Food & Dining", icon: "🍽️", color: "miami-purple" }
  }
  if (lower.includes("event") || lower.includes("nightlife") || lower.includes("club") || lower.includes("bar")) {
    return { category: "Events & Nightlife", icon: "🎉", color: "miami-pink" }
  }
  if (lower.includes("beach") || lower.includes("park") || lower.includes("outdoor") || lower.includes("nature")) {
    return { category: "Lifestyle", icon: "🌴", color: "miami-blue" }
  }

  return { category: "Explore More", icon: "✨", color: "miami-aqua" }
}

export function RelatedSearches({ searches, onSelect }: RelatedSearchesProps) {
  if (searches.length === 0) return null

  const categorized = searches.reduce(
    (acc, search) => {
      const { category } = categorizeSearch(search)
      if (!acc[category]) acc[category] = []
      acc[category].push(search)
      return acc
    },
    {} as Record<string, string[]>,
  )

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-miami-aqua/20 to-miami-blue/20 flex items-center justify-center border border-miami-aqua/30">
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Related Searches</h3>
          <p className="text-sm text-muted-foreground">Explore similar topics</p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(categorized).map(([category, categorySearches]) => {
          const { icon, color } = categorizeSearch(categorySearches[0])

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <span className="text-base">{icon}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{category}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorySearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(search)}
                    className={`text-sm hover:bg-${color}/10 hover:border-${color} hover:text-${color} transition-all hover:shadow-md hover:shadow-${color}/20 hover:scale-105 border-2`}
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
