// Popular search topics and suggestions
export const searchSuggestions = [
  "What is artificial intelligence?",
  "How does blockchain work?",
  "Latest tech news",
  "Climate change solutions",
  "Best programming languages 2025",
  "How to start a business",
  "Healthy meal prep ideas",
  "Travel destinations 2025",
  "Stock market trends",
  "Cryptocurrency explained",
]

// Generate related searches based on query
export function generateRelatedSearches(query: string): string[] {
  const related: string[] = []

  // Extract key terms (simple implementation)
  const terms = query
    .toLowerCase()
    .split(" ")
    .filter((t) => t.length > 3)

  if (terms.length > 0) {
    related.push(`${query} explained`)
    related.push(`${query} examples`)
    related.push(`${query} vs alternatives`)
    related.push(`Latest ${query} news`)
    related.push(`How to ${query}`)
  }

  return related.slice(0, 5)
}

// Simple autocomplete matching
export function getAutocompleteSuggestions(input: string, limit = 5): string[] {
  if (!input || input.length < 2) return []

  const lowerInput = input.toLowerCase()
  return searchSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(lowerInput)).slice(0, limit)
}
