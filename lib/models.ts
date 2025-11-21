import type { ModelOption, ModelId } from "@/types"

export const MODELS: Record<ModelId, ModelOption> = {
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Most capable model, best for complex queries",
    contextWindow: 128000,
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and efficient, great for quick searches",
    contextWindow: 128000,
  },
  "claude-3.5-sonnet": {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Excellent reasoning and analysis",
    contextWindow: 200000,
  },
  "claude-3.5-haiku": {
    id: "claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Fast responses with good quality",
    contextWindow: 200000,
  },
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Multimodal with fast performance",
    contextWindow: 1000000,
  },
}

export const DEFAULT_MODEL: ModelId = "gpt-4o-mini"

export function getModelById(id: string): ModelOption | undefined {
  return MODELS[id as ModelId]
}
