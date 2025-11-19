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

export interface BoardPersona {
  name: string
  role: string
  avatar: string
  model: string
}

export interface BoardResponse {
  persona: string
  round: number
  content: string
}

export type BoardType = "startup" | "ethical" | "creative"

export interface BoardroomMessage {
  id: string
  type: "boardroom"
  query: string
  sessionId: string
  personas: BoardPersona[]
  responses: BoardResponse[]
  synthesis?: string
  isStreaming?: boolean
}

export interface CouncilAdvisorResponse {
  advisorArchetype: string
  advisorName: string
  round: number
  content: string
  modelUsed: string
}

export interface CouncilAdvisor {
  archetype: string
  name: string
  model: string
}

export interface CouncilMessage {
  id: string
  type: "council"
  query: string
  debateId: string
  councilId?: string
  councilName?: string
  advisors: CouncilAdvisor[]
  responses: CouncilAdvisorResponse[]
  verdict?: string
  isStreaming?: boolean
}
// </CHANGE>

export type ConversationMessage = 
  | {
      id: string
      type: "search"
      query: string
      response?: string
      citations?: Citation[]
      modelInfo?: ModelInfo
      relatedSearches?: string[]
      attachments?: Attachment[]
      isStreaming?: boolean
      searchId?: string
    }
  | {
      id: string
      type: "image"
      query: string
      generatedImage?: GeneratedImage
      isStreaming?: boolean
    }
  | BoardroomMessage
  | CouncilMessage // Adding Council to conversation types

export interface SearchState {
  mode: SearchMode
  contentType: ContentType
  boardroomMode: boolean
  boardType: BoardType
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
  name?: string
  role?: string
}

export type SearchAction =
  | { type: "START_SEARCH"; query: string; mode: SearchMode }
  | { type: "START_BOARDROOM"; query: string; boardType: BoardType }
  | { type: "SET_BOARDROOM_SESSION"; sessionId: string; personas: BoardPersona[] }
  | { type: "START_COUNCIL"; query: string; councilId: string | null } // Adding Council actions
  | { type: "SET_COUNCIL_SESSION"; debateId: string; councilId: string | null; councilName: string | null; advisors: CouncilAdvisor[] } // 
  | { type: "UPDATE_COUNCIL_RESPONSE"; advisorArchetype: string; advisorName: string; round: number; content: string; modelUsed: string } // 
  | { type: "SET_COUNCIL_VERDICT"; content: string } // 
  | { type: "START_IMAGE_GENERATION"; prompt: string }
  | { type: "UPDATE_CURRENT_RESPONSE"; response: string }
  | { type: "UPDATE_BOARDROOM_RESPONSE"; persona: string; round: number; content: string }
  | { type: "SET_BOARDROOM_SYNTHESIS"; content: string }
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
  | { type: "SET_BOARDROOM_MODE"; enabled: boolean }
  | { type: "SET_BOARD_TYPE"; boardType: BoardType }
  | { type: "LOAD_FROM_HISTORY"; history: any }
  | { type: "SET_SEARCH_ID"; searchId: string }
