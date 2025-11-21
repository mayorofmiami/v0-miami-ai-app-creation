import type { SearchState, SearchAction, Message } from "@/types"

export const initialSearchState: SearchState = {
  query: "",
  messages: [],
  isLoading: false,
  hasSearched: false,
  selectedModel: "gpt-4o-mini",
  mode: "search",
  currentThreadId: null,
  error: null,
  rateLimitInfo: null,
}

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload }

    case "START_SEARCH":
      return {
        ...state,
        query: action.payload.query,
        selectedModel: action.payload.model,
        isLoading: true,
        hasSearched: true,
        error: null,
      }

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        isLoading: false,
      }

    case "UPDATE_CURRENT_MESSAGE":
      const lastMessage = state.messages[state.messages.length - 1]
      if (!lastMessage || lastMessage.role !== "assistant") {
        // Create new assistant message
        const newMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: action.payload,
          model: state.selectedModel,
          timestamp: new Date(),
        }
        return {
          ...state,
          messages: [...state.messages, newMessage],
        }
      }
      // Update existing message
      const updatedMessages = [...state.messages]
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: action.payload,
      }
      return { ...state, messages: updatedMessages }

    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false }

    case "SET_MODEL":
      return { ...state, selectedModel: action.payload }

    case "SET_MODE":
      return { ...state, mode: action.payload }

    case "SET_THREAD_ID":
      return { ...state, currentThreadId: action.payload }

    case "SET_RATE_LIMIT":
      return { ...state, rateLimitInfo: action.payload }

    case "CLEAR_SEARCH":
      return {
        ...initialSearchState,
        selectedModel: state.selectedModel, // Preserve model selection
      }

    case "LOAD_HISTORY":
      return {
        ...state,
        messages: action.payload,
        hasSearched: action.payload.length > 0,
      }

    default:
      return state
  }
}
