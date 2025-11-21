// AI Models
export type ModelId = "gpt-4o" | "gpt-4o-mini" | "claude-3.5-sonnet" | "claude-3.5-haiku" | "gemini-2.0-flash"

export interface ModelOption {
  id: ModelId
  name: string
  provider: string
  description: string
  contextWindow: number
}

// User
export interface User {
  id: string
  email: string
  name?: string
  role?: "user" | "admin"
}

// Messages & Conversations
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string
  citations?: Citation[]
  timestamp: Date
}

export interface Citation {
  title: string
  url: string
  snippet: string
}

// Threads
export interface Thread {
  id: string
  user_id: string
  title: string
  mode: "search" | "generate"
  created_at: Date
  updated_at: Date
}

// Search History
export interface SearchHistoryItem {
  id: string
  thread_id: string
  user_id: string
  query: string
  response: string
  model_used: string
  mode: "search" | "generate"
  citations: Citation[]
  position_in_thread: number
  created_at: Date
}

// Bookmarks
export interface Bookmark {
  id: string
  user_id: string
  search_id: string
  created_at: Date
}

// Rate Limiting
export interface RateLimitConfig {
  feature: string
  max_requests: number
  window_seconds: number
  description: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: Date
}

// Image Generation
export interface GeneratedImage {
  id: string
  user_id: string
  prompt: string
  image_url: string
  model_used: string
  resolution: string
  created_at: Date
}

// Search State (for React)
export interface SearchState {
  query: string
  messages: Message[]
  isLoading: boolean
  hasSearched: boolean
  selectedModel: ModelId
  mode: "search" | "generate"
  currentThreadId: string | null
  error: string | null
  rateLimitInfo: RateLimitResult | null
}

export type SearchAction =
  | { type: "SET_QUERY"; payload: string }
  | { type: "START_SEARCH"; payload: { query: string; model: ModelId } }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_CURRENT_MESSAGE"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_MODEL"; payload: ModelId }
  | { type: "SET_MODE"; payload: "search" | "generate" }
  | { type: "SET_THREAD_ID"; payload: string }
  | { type: "SET_RATE_LIMIT"; payload: RateLimitResult }
  | { type: "CLEAR_SEARCH" }
  | { type: "LOAD_HISTORY"; payload: Message[] }

// Theme
export type Theme = "zinc" | "blue" | "green" | "orange" | "rose" | "violet"
