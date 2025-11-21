import type { SearchMode, ContentType, Message, SearchModelInfo, RateLimitInfo, ImageRateLimit } from "@/types"

export interface SearchState {
  mode: SearchMode
  contentType: ContentType
  isLoading: boolean
  messages: Message[]
  hasSearched: boolean
  rateLimitInfo: RateLimitInfo | null
  imageRateLimit: ImageRateLimit | null
}

export type SearchAction =
  | { type: "SET_MODE"; mode: SearchMode }
  | { type: "SET_CONTENT_TYPE"; contentType: ContentType }
  | { type: "START_SEARCH"; query: string; mode: SearchMode }
  | { type: "START_IMAGE_GENERATION"; prompt: string }
  | { type: "UPDATE_CURRENT_RESPONSE"; response: string }
  | { type: "SET_CURRENT_CITATIONS"; citations: any[] }
  | { type: "SET_CURRENT_MODEL_INFO"; modelInfo: SearchModelInfo }
  | { type: "SEARCH_COMPLETE" }
  | { type: "SEARCH_ERROR"; error: string }
  | { type: "SET_SEARCH_ID"; searchId: string }
  | { type: "SET_GENERATED_IMAGE"; image: string; rateLimit: ImageRateLimit }
  | { type: "CLEAR_SEARCH" }
  | { type: "SET_RATE_LIMIT"; rateLimitInfo: RateLimitInfo }

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode }

    case "SET_CONTENT_TYPE":
      return { ...state, contentType: action.contentType }

    case "START_SEARCH":
      return {
        ...state,
        isLoading: true,
        hasSearched: true,
        messages: [
          ...state.messages,
          {
            id: `search-${Date.now()}`,
            type: "search",
            query: action.query,
            timestamp: new Date().toISOString(),
          },
          {
            id: `response-${Date.now()}`,
            type: "response",
            query: action.query,
            response: "",
            citations: [],
            isStreaming: true,
            timestamp: new Date().toISOString(),
          },
        ],
      }

    case "START_IMAGE_GENERATION":
      return {
        ...state,
        isLoading: true,
        hasSearched: true,
        messages: [
          ...state.messages,
          {
            id: `image-gen-${Date.now()}`,
            type: "image_generation",
            query: action.prompt,
            timestamp: new Date().toISOString(),
          },
        ],
      }

    case "UPDATE_CURRENT_RESPONSE": {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === "response") {
        lastMessage.response = action.response
      }
      return { ...state, messages }
    }

    case "SET_CURRENT_CITATIONS": {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === "response") {
        lastMessage.citations = action.citations
      }
      return { ...state, messages }
    }

    case "SET_CURRENT_MODEL_INFO": {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === "response") {
        lastMessage.modelInfo = action.modelInfo
      }
      return { ...state, messages }
    }

    case "SEARCH_COMPLETE": {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === "response") {
        lastMessage.isStreaming = false
      }
      return { ...state, isLoading: false, messages }
    }

    case "SEARCH_ERROR": {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === "response") {
        lastMessage.error = action.error
        lastMessage.isStreaming = false
      }
      return { ...state, isLoading: false, messages }
    }

    case "SET_SEARCH_ID": {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === "response") {
        lastMessage.searchId = action.searchId
      }
      return { ...state, messages }
    }

    case "SET_GENERATED_IMAGE": {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === "image_generation") {
        lastMessage.imageUrl = action.image
      }
      return {
        ...state,
        isLoading: false,
        messages,
        imageRateLimit: action.rateLimit,
      }
    }

    case "CLEAR_SEARCH":
      return {
        ...state,
        messages: [],
        hasSearched: false,
        isLoading: false,
      }

    case "SET_RATE_LIMIT":
      return {
        ...state,
        rateLimitInfo: action.rateLimitInfo,
      }

    default:
      return state
  }
}
