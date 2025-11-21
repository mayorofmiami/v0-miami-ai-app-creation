export type ModelId =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "grok-beta"
  | "o1"
  | "o1-mini"

export interface ModelInfo {
  id: ModelId
  name: string
  description: string
  provider: string
  capabilities: string[]
  requiresSubscription?: boolean
}

export interface SearchMode {
  id: string
  name: string
  description: string
}

export interface RateLimitInfo {
  allowed: boolean
  remaining: number
  resetAt?: number
}
