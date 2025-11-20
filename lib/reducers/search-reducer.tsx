import type { SearchState, SearchAction } from "@/types"

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "START_SEARCH":
      return {
        ...state,
        isLoading: true,
        hasSearched: true,
        mode: action.mode,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            type: "search",
            query: action.query,
            isStreaming: true,
          },
        ],
      }

    case "START_BOARDROOM":
      return {
        ...state,
        isLoading: true,
        hasSearched: true,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            type: "boardroom",
            query: action.query,
            sessionId: `session-${Date.now()}`,
            personas: [],
            responses: [],
            isStreaming: true,
          },
        ],
      }

    case "START_COUNCIL":
      return {
        ...state,
        isLoading: true,
        hasSearched: true,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            type: "council",
            query: action.query,
            debateId: "",
            councilId: action.councilId || undefined,
            advisors: [],
            responses: [],
            isStreaming: true,
          },
        ],
      }

    case "SET_COUNCIL_SESSION":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "council"
            ? {
                ...msg,
                debateId: action.debateId,
                councilId: action.councilId || undefined,
                councilName: action.councilName || undefined,
                advisors: action.advisors,
              }
            : msg,
        ),
      }

    case "UPDATE_COUNCIL_RESPONSE":
      return {
        ...state,
        messages: state.messages.map((msg, idx) => {
          if (idx === state.messages.length - 1 && msg.type === "council") {
            const existingResponse = msg.responses.find(
              (r) => r.advisorArchetype === action.advisorArchetype && r.round === action.round,
            )

            if (existingResponse) {
              return {
                ...msg,
                responses: msg.responses.map((r) =>
                  r.advisorArchetype === action.advisorArchetype && r.round === action.round
                    ? { ...r, content: r.content + action.content }
                    : r,
                ),
              }
            } else {
              return {
                ...msg,
                responses: [
                  ...msg.responses,
                  {
                    advisorArchetype: action.advisorArchetype,
                    advisorName: action.advisorName,
                    round: action.round,
                    content: action.content,
                    modelUsed: action.modelUsed,
                  },
                ],
              }
            }
          }
          return msg
        }),
      }

    case "SET_COUNCIL_VERDICT":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "council"
            ? { ...msg, verdict: (msg.verdict || "") + action.content }
            : msg,
        ),
      }

    case "SET_BOARDROOM_SESSION":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "boardroom"
            ? {
                ...msg,
                sessionId: action.sessionId,
                personas: action.personas,
              }
            : msg,
        ),
      }

    case "UPDATE_BOARDROOM_RESPONSE":
      return {
        ...state,
        messages: state.messages.map((msg, idx) => {
          if (idx === state.messages.length - 1 && msg.type === "boardroom") {
            const existingResponse = msg.responses.find((r) => r.persona === action.persona && r.round === action.round)

            if (existingResponse) {
              return {
                ...msg,
                responses: msg.responses.map((r) =>
                  r.persona === action.persona && r.round === action.round
                    ? { ...r, content: r.content + action.content }
                    : r,
                ),
              }
            } else {
              return {
                ...msg,
                responses: [
                  ...msg.responses,
                  {
                    persona: action.persona,
                    round: action.round,
                    content: action.content,
                  },
                ],
              }
            }
          }
          return msg
        }),
      }

    case "SET_BOARDROOM_SYNTHESIS":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "boardroom"
            ? { ...msg, synthesis: (msg.synthesis || "") + action.content }
            : msg,
        ),
      }

    case "START_IMAGE_GENERATION":
      return {
        ...state,
        isLoading: true,
        hasSearched: true,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            type: "image",
            query: action.prompt,
            isStreaming: true,
          },
        ],
      }
    case "UPDATE_CURRENT_RESPONSE":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "search" ? { ...msg, response: action.response } : msg,
        ),
      }
    case "SET_CURRENT_CITATIONS":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "search" ? { ...msg, citations: action.citations } : msg,
        ),
      }
    case "SET_CURRENT_MODEL_INFO":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "search" ? { ...msg, modelInfo: action.modelInfo } : msg,
        ),
      }
    case "SET_CURRENT_RELATED_SEARCHES":
      return state
    case "SET_GENERATED_IMAGE":
      return {
        ...state,
        isLoading: false,
        imageRateLimit: action.rateLimit,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "image"
            ? { ...msg, generatedImage: action.image, isStreaming: false }
            : msg,
        ),
      }
    case "SET_RATE_LIMIT":
      return { ...state, rateLimitInfo: action.rateLimitInfo }
    case "SEARCH_COMPLETE":
      return {
        ...state,
        isLoading: false,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 ? { ...msg, isStreaming: false } : msg,
        ),
      }
    case "SEARCH_ERROR":
      return {
        ...state,
        isLoading: false,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1
            ? { ...msg, response: msg.type === "search" ? action.error : undefined, isStreaming: false }
            : msg,
        ),
      }
    case "CLEAR_SEARCH":
      return {
        ...state,
        hasSearched: false,
        messages: [],
        imageRateLimit: null,
      }
    case "SET_MODE":
      return { ...state, mode: action.mode }
    case "SET_CONTENT_TYPE":
      return { ...state, contentType: action.contentType }

    case "SET_BOARDROOM_MODE":
      return { ...state, boardroomMode: action.enabled }

    case "SET_BOARD_TYPE":
      return { ...state, boardType: action.boardType }

    case "LOAD_FROM_HISTORY":
      return {
        ...state,
        hasSearched: true,
        mode: action.history.mode,
        messages: [
          {
            id: action.history.id || Date.now().toString(),
            type: action.history.generated_image ? "image" : "search",
            query: action.history.query,
            response: action.history.response,
            citations: action.history.citations || [],
            modelInfo: action.history.model_used
              ? {
                  model: action.history.model_used,
                  reason: action.history.selection_reason || "",
                  autoSelected: action.history.auto_selected ?? true,
                }
              : undefined,
            generatedImage: action.history.generated_image || undefined,
            isStreaming: false,
          },
        ],
      }
    case "SET_SEARCH_ID":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === "search" ? { ...msg, searchId: action.searchId } : msg,
        ),
      }
    default:
      return state
  }
}
