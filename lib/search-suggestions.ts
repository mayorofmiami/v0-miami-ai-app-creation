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
  const lowerQuery = query.toLowerCase().trim()

  // Detect query type and extract core topic
  const isHowTo = /^(how (do|to|can)|what('s| is) the (best )?way)/i.test(query)
  const isWhat = /^what (is|are|does)/i.test(query)
  const isWhy = /^why (is|are|does|do)/i.test(query)
  const isComparison = /\b(vs|versus|compared to|better than|difference between)\b/i.test(query)
  const isBest = /^(best|top|greatest)/i.test(query)

  // Extract core topic by removing common question words
  const coreTopic = query
    .replace(/^(how (do|to|can) i|what (is|are|does)|why (is|are|does|do)|when (is|are|does|do))\s+/i, "")
    .replace(/\?$/, "")
    .trim()

  // Generate diverse related searches based on query type
  if (isHowTo) {
    // For how-to questions, suggest related practical questions
    related.push(`What are common mistakes when ${coreTopic}`)
    related.push(`Best practices for ${coreTopic}`)
    related.push(`${coreTopic} step by step guide`)
    related.push(`Tools needed for ${coreTopic}`)
    related.push(`${coreTopic} safety tips`)
  } else if (isWhat) {
    // For "what is" questions, suggest deeper exploration
    related.push(`How does ${coreTopic} work`)
    related.push(`${coreTopic} real world applications`)
    related.push(`Benefits and drawbacks of ${coreTopic}`)
    related.push(`${coreTopic} vs similar concepts`)
    related.push(`Future of ${coreTopic}`)
  } else if (isWhy) {
    // For "why" questions, suggest related cause/effect questions
    related.push(`How does ${coreTopic} affect us`)
    related.push(`${coreTopic} explained simply`)
    related.push(`What causes ${coreTopic}`)
    related.push(`${coreTopic} historical context`)
    related.push(`Solutions for ${coreTopic}`)
  } else if (isComparison) {
    // For comparison questions, suggest alternatives and criteria
    related.push(`Pros and cons of ${coreTopic}`)
    related.push(`Which is better for beginners: ${coreTopic}`)
    related.push(`${coreTopic} cost comparison`)
    related.push(`${coreTopic} performance benchmarks`)
    related.push(`When to choose ${coreTopic}`)
  } else if (isBest) {
    // For "best" questions, suggest criteria and alternatives
    related.push(`How to choose ${coreTopic}`)
    related.push(`${coreTopic} for beginners`)
    related.push(`${coreTopic} comparison guide`)
    related.push(`Most popular ${coreTopic}`)
    related.push(`${coreTopic} reviews and ratings`)
  } else {
    // Generic diverse suggestions for other query types
    const templates = [
      `What are the benefits of ${coreTopic}`,
      `${coreTopic} common problems and solutions`,
      `How to get started with ${coreTopic}`,
      `${coreTopic} expert tips and tricks`,
      `Latest developments in ${coreTopic}`,
      `${coreTopic} cost and pricing`,
      `${coreTopic} alternatives and options`,
      `${coreTopic} for beginners guide`,
    ]

    // Randomly select 5 diverse templates
    const shuffled = templates.sort(() => Math.random() - 0.5)
    related.push(...shuffled.slice(0, 5))
  }

  // Ensure we have exactly 5 unique suggestions
  const uniqueRelated = Array.from(new Set(related))

  // If we don't have enough, add some generic follow-ups
  while (uniqueRelated.length < 5) {
    const fallbacks = [
      `${coreTopic} detailed explanation`,
      `${coreTopic} use cases`,
      `${coreTopic} pros and cons`,
      `${coreTopic} latest trends`,
      `${coreTopic} expert advice`,
    ]

    for (const fallback of fallbacks) {
      if (!uniqueRelated.includes(fallback)) {
        uniqueRelated.push(fallback)
        if (uniqueRelated.length >= 5) break
      }
    }
  }

  return uniqueRelated.slice(0, 5)
}

// Simple autocomplete matching
export function getAutocompleteSuggestions(input: string, limit = 5): string[] {
  if (!input || input.length < 2) return []

  const lowerInput = input.toLowerCase()
  return searchSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(lowerInput)).slice(0, limit)
}
