// Query complexity analyzer for smart model routing
export type QueryComplexity = "simple" | "medium" | "complex"

interface ComplexityIndicators {
  length: number
  hasComparison: boolean
  hasAnalysis: boolean
  hasMultipleQuestions: boolean
  hasCode: boolean
  hasMath: boolean
  isDefinition: boolean
  isFact: boolean
}

export function analyzeQueryComplexity(query: string): QueryComplexity {
  const indicators: ComplexityIndicators = {
    length: query.length,
    hasComparison: /\b(compare|versus|vs|difference between|better than)\b/i.test(query),
    hasAnalysis: /\b(analyze|explain|why|how does|elaborate|discuss|evaluate)\b/i.test(query),
    hasMultipleQuestions: (query.match(/\?/g) || []).length > 1,
    hasCode: /\b(code|function|algorithm|implement|debug)\b/i.test(query),
    hasMath: /\b(calculate|solve|equation|formula|math)\b/i.test(query),
    isDefinition: /\b(what is|define|meaning of|definition)\b/i.test(query),
    isFact: /\b(when|where|who|which)\b/i.test(query) && query.length < 100,
  }

  // Simple queries: short, factual, definitions
  if (
    (indicators.isDefinition || indicators.isFact) &&
    indicators.length < 100 &&
    !indicators.hasAnalysis &&
    !indicators.hasComparison
  ) {
    return "simple"
  }

  // Complex queries: long, multiple questions, analysis, code, comparisons
  if (
    indicators.length > 200 ||
    indicators.hasMultipleQuestions ||
    (indicators.hasAnalysis && indicators.hasComparison) ||
    indicators.hasCode ||
    indicators.hasMath
  ) {
    return "complex"
  }

  // Medium complexity: everything else
  return "medium"
}

export function getRecommendedModel(
  complexity: QueryComplexity,
  mode: "quick" | "deep",
  userTier: "free" | "pro" = "free",
): string {
  // Deep research mode always uses better models
  if (mode === "deep") {
    if (userTier === "pro") {
      return complexity === "complex" ? "anthropic/claude-3.5-sonnet" : "anthropic/claude-3.5-haiku"
    }
    // Free users get cheaper models for deep research
    return complexity === "complex" ? "anthropic/claude-3.5-haiku" : "groq/llama-3.3-70b"
  }

  // Quick mode routing based on complexity
  if (complexity === "simple") {
    return "google/gemini-2.0-flash" // Cheapest for simple queries
  }

  if (complexity === "medium") {
    return userTier === "pro" ? "openai/gpt-4o-mini" : "groq/llama-3.1-8b"
  }

  // Complex queries
  if (userTier === "pro") {
    return "openai/gpt-4o"
  }

  return "openai/gpt-4o-mini" // Free users get mini for complex quick queries
}
