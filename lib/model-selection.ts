import "server-only"

export type AIModel =
  | "openai/gpt-4o-mini"
  | "openai/gpt-4o"
  | "anthropic/claude-3.5-sonnet"
  | "anthropic/claude-3.5-haiku"

export interface ModelInfo {
  id: AIModel
  name: string
  description: string
  bestFor: string[]
  speed: "fast" | "medium" | "slow"
  quality: "good" | "great" | "excellent"
}

export const AVAILABLE_MODELS: Record<AIModel, ModelInfo> = {
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast responses for general queries",
    bestFor: ["quick questions", "simple tasks", "conversational queries"],
    speed: "fast",
    quality: "good",
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Complex analysis and detailed research",
    bestFor: ["deep analysis", "complex reasoning", "detailed research"],
    speed: "medium",
    quality: "excellent",
  },
  "anthropic/claude-3.5-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Long-form content and nuanced understanding",
    bestFor: ["long-form writing", "nuanced analysis", "creative tasks"],
    speed: "medium",
    quality: "excellent",
  },
  "anthropic/claude-3.5-haiku": {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    description: "Balanced speed and quality",
    bestFor: ["balanced tasks", "quick summaries", "general queries"],
    speed: "fast",
    quality: "great",
  },
}

export interface QueryAnalysis {
  length: number
  hasTimeReference: boolean
  isComparison: boolean
  isAnalytical: boolean
  isFactual: boolean
  isCreative: boolean
  complexity: number
  keywords: string[]
}

export interface ModelSelection {
  model: AIModel
  modelInfo: ModelInfo
  reason: string
  confidence: number
  analysis: QueryAnalysis
}

/**
 * Analyze a query to determine its characteristics
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const lowerQuery = query.toLowerCase()

  // Check for time references
  const hasTimeReference = /\b(today|now|latest|recent|current|2024|2025)\b/i.test(query)

  // Check for comparison
  const isComparison = /\b(compare|vs|versus|difference|better|best)\b/i.test(query)

  // Check for analytical queries
  const isAnalytical = /\b(analyze|why|how|explain|impact|effect|cause|reason)\b/i.test(query)

  // Check for factual queries
  const isFactual = /\b(what|when|where|who|which)\b/i.test(query)

  // Check for creative queries
  const isCreative = /\b(create|write|design|generate|make|build)\b/i.test(query)

  // Calculate complexity based on multiple factors
  const wordCount = query.split(/\s+/).length
  const hasMultipleSentences = query.split(/[.!?]+/).length > 1
  const hasComplexWords = /\b\w{10,}\b/.test(query)

  let complexity = 0
  if (wordCount > 20) complexity += 2
  else if (wordCount > 10) complexity += 1
  if (hasMultipleSentences) complexity += 1
  if (hasComplexWords) complexity += 1
  if (isAnalytical) complexity += 2
  if (isComparison) complexity += 1

  // Extract keywords
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5)

  return {
    length: query.length,
    hasTimeReference,
    isComparison,
    isAnalytical,
    isFactual,
    isCreative,
    complexity,
    keywords,
  }
}

/**
 * Score a model based on query analysis
 */
function scoreModel(model: AIModel, analysis: QueryAnalysis, mode: "quick" | "deep"): number {
  let score = 0
  const modelInfo = AVAILABLE_MODELS[model]

  // Base score from mode preference
  if (mode === "quick") {
    if (modelInfo.speed === "fast") score += 3
    else if (modelInfo.speed === "medium") score += 1
  } else {
    // Deep mode
    if (modelInfo.quality === "excellent") score += 3
    else if (modelInfo.quality === "great") score += 2
  }

  // Adjust based on query characteristics
  if (analysis.complexity > 3) {
    // Complex queries benefit from better models
    if (model === "openai/gpt-4o" || model === "anthropic/claude-3.5-sonnet") {
      score += 2
    }
  } else {
    // Simple queries can use faster models
    if (model === "openai/gpt-4o-mini" || model === "anthropic/claude-3.5-haiku") {
      score += 2
    }
  }

  // Analytical queries
  if (analysis.isAnalytical) {
    if (model === "openai/gpt-4o" || model === "anthropic/claude-3.5-sonnet") {
      score += 2
    }
  }

  // Creative queries
  if (analysis.isCreative) {
    if (model === "anthropic/claude-3.5-sonnet") {
      score += 2
    }
  }

  // Factual queries
  if (analysis.isFactual && !analysis.isAnalytical) {
    if (model === "openai/gpt-4o-mini" || model === "anthropic/claude-3.5-haiku") {
      score += 1
    }
  }

  // Time-sensitive queries
  if (analysis.hasTimeReference) {
    // All models have access to current data via search
    score += 0
  }

  return score
}

/**
 * Select the best model for a given query
 */
export function selectModel(query: string, mode: "quick" | "deep"): ModelSelection {
  const analysis = analyzeQuery(query)

  // Score all models
  const scores: Record<AIModel, number> = {
    "openai/gpt-4o-mini": scoreModel("openai/gpt-4o-mini", analysis, mode),
    "openai/gpt-4o": scoreModel("openai/gpt-4o", analysis, mode),
    "anthropic/claude-3.5-sonnet": scoreModel("anthropic/claude-3.5-sonnet", analysis, mode),
    "anthropic/claude-3.5-haiku": scoreModel("anthropic/claude-3.5-haiku", analysis, mode),
  }

  // Find the highest scoring model
  const sortedModels = (Object.entries(scores) as [AIModel, number][]).sort(([, a], [, b]) => b - a)

  const [selectedModel, score] = sortedModels[0]
  const modelInfo = AVAILABLE_MODELS[selectedModel]

  // Generate reason
  const reason = generateReason(selectedModel, analysis, mode)

  // Calculate confidence (normalized score)
  const maxPossibleScore = 10
  const confidence = Math.min(score / maxPossibleScore, 1)

  return {
    model: selectedModel,
    modelInfo,
    reason,
    confidence,
    analysis,
  }
}

/**
 * Generate a human-readable reason for model selection
 */
function generateReason(model: AIModel, analysis: QueryAnalysis, mode: "quick" | "deep"): string {
  const modelInfo = AVAILABLE_MODELS[model]

  if (mode === "quick") {
    if (analysis.complexity < 2) {
      return `Selected ${modelInfo.name} for fast responses to simple queries`
    }
    return `Selected ${modelInfo.name} for balanced speed and quality`
  }

  // Deep mode
  if (analysis.isAnalytical) {
    return `Selected ${modelInfo.name} for complex analytical reasoning`
  }

  if (analysis.isCreative) {
    return `Selected ${modelInfo.name} for creative and nuanced content`
  }

  if (analysis.complexity > 3) {
    return `Selected ${modelInfo.name} for detailed research and analysis`
  }

  return `Selected ${modelInfo.name} for comprehensive research`
}

/**
 * Get model by ID with fallback
 */
export function getModelById(modelId: string): AIModel {
  if (modelId in AVAILABLE_MODELS) {
    return modelId as AIModel
  }

  // Fallback to GPT-4o Mini
  return "openai/gpt-4o-mini"
}
