export type ModelId =
  | "auto"
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "anthropic/claude-3.5-sonnet"
  | "anthropic/claude-3.5-haiku"
  | "groq/llama-3.3-70b"
  | "groq/llama-3.1-8b"
  | "google/gemini-2.0-flash"

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  blobUrl?: string
  preview?: string
}

export interface AttachmentRateLimit {
  currentCount: number
  limit: number
  remaining: number
  resetAt: Date
}

export type SearchMode = "quick" | "deep"
export type ContentType = "search" | "image"

export interface Citation {
  title: string
  url: string
  snippet: string
}

export interface ModelInfo {
  model: string
  reason: string
  autoSelected: boolean
}

export interface GeneratedImage {
  url: string
  prompt: string
  model: string
  resolution: string
  createdAt: string
}

export interface ConversationMessage {
  id: string
  type: ContentType
  query: string
  response?: string
  citations?: Citation[]
  modelInfo?: ModelInfo
  relatedSearches?: string[]
  generatedImage?: GeneratedImage
  attachments?: Attachment[]
  isStreaming?: boolean
}

export interface SearchState {
  mode: SearchMode
  contentType: ContentType
  isLoading: boolean
  messages: ConversationMessage[]
  hasSearched: boolean
  rateLimitInfo: { remaining: number; limit: number } | null
  imageRateLimit: { currentCount: number; limit: number; remaining: number } | null
}

export interface RateLimitInfo {
  remaining: number
  limit: number
}

export interface ImageRateLimit {
  currentCount: number
  limit: number
  remaining: number
}

export interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  profileImageUrl?: string | null
}

export type SearchAction =
  | { type: "START_SEARCH"; query: string; mode: SearchMode }
  | { type: "START_IMAGE_GENERATION"; prompt: string }
  | { type: "UPDATE_CURRENT_RESPONSE"; response: string }
  | { type: "SET_CURRENT_CITATIONS"; citations: Citation[] }
  | { type: "SET_CURRENT_MODEL_INFO"; modelInfo: ModelInfo }
  | { type: "SET_CURRENT_RELATED_SEARCHES"; relatedSearches: string[] }
  | { type: "SET_GENERATED_IMAGE"; image: any; rateLimit: any }
  | { type: "SET_RATE_LIMIT"; rateLimitInfo: RateLimitInfo }
  | { type: "SEARCH_COMPLETE" }
  | { type: "SEARCH_ERROR"; error: string }
  | { type: "CLEAR_SEARCH" }
  | { type: "SET_MODE"; mode: SearchMode }
  | { type: "SET_CONTENT_TYPE"; contentType: ContentType }
  | { type: "LOAD_FROM_HISTORY"; history: any }
