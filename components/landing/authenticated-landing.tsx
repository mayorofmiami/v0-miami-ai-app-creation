"use client"

import { useState, useRef, useEffect, useCallback, useReducer, Suspense, useMemo } from "react"
import { SearchInput } from "@/components/search-input"
import { HistorySidebar } from "@/components/history-sidebar"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import type { ModelId } from "@/components/model-selector"
import type { SearchHistory } from "@/lib/db"
import { toast } from "@/lib/toast"
import type { SearchInputRef } from "@/components/search-input"
import { useTheme } from "next-themes"
import type { Attachment } from "@/types"
import type { SearchState, SearchAction, SearchMode, ContentType, User } from "@/types"
import { PageHeader } from "@/components/page-header"
import { ExampleQueries } from "@/components/example-queries"
import { handleSearchError } from "@/lib/error-handling"
import { handleImageError } from "@/lib/error-handling"
import { storage, STORAGE_KEYS, threadStorage } from "@/lib/local-storage"
import { logger } from "@/lib/logger"
import { ConversationView } from "@/components/search-page/conversation-view"
import { SearchFormContainer } from "@/components/search-page/search-form-container"
import { BookmarksSidebar } from "@/components/bookmarks-sidebar"
import XIcon from "@/components/icons/X"
import { searchReducer } from "@/lib/reducers/search-reducer"
import { CouncilSelectorDialog } from "@/components/council/council-selector-dialog"

function searchReducer(state: SearchState, action: SearchAction): SearchState {
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
          idx === state.messages.length - 1 ? { ...msg, response: action.response } : msg,
        ),
      }
    case "SET_CURRENT_CITATIONS":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 ? { ...msg, citations: action.citations } : msg,
        ),
      }
    case "SET_CURRENT_MODEL_INFO":
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 ? { ...msg, modelInfo: action.modelInfo } : msg,
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
          idx === state.messages.length - 1 ? { ...msg, generatedImage: action.image, isStreaming: false } : msg,
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
          idx === state.messages.length - 1 ? { ...msg, response: action.error, isStreaming: false } : msg,
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
          idx === state.messages.length - 1 ? { ...msg, searchId: action.searchId } : msg,
        ),
      }
    case "SET_BOARDROOM_MODE":
      return { ...state, boardroomMode: action.enabled }
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
            sessionId: "",
            personas: [],
            responses: [],
            isStreaming: true,
          },
        ],
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
            const existingResponses = msg.responses || []
            const existingResponseIndex = existingResponses.findIndex(
              (r) => r.persona === action.persona && r.round === action.round
            )
            
            let updatedResponses
            if (existingResponseIndex >= 0) {
              updatedResponses = existingResponses.map((r, i) =>
                i === existingResponseIndex
                  ? { ...r, content: r.content + action.content }
                  : r
              )
            } else {
              updatedResponses = [
                ...existingResponses,
                {
                  persona: action.persona,
                  round: action.round,
                  content: action.content,
                },
              ]
            }
            
            return {
              ...msg,
              responses: updatedResponses,
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
    default:
      return state
  }
}

interface AuthenticatedLandingProps {
  user: User
  initialHistory: SearchHistory[]
  initialModelPreference: any
  initialBookmarks: any[]
}

export function AuthenticatedLanding({
  user,
  initialHistory,
  initialModelPreference,
  initialBookmarks,
}: AuthenticatedLandingProps) {
  const { theme, setTheme } = useTheme()

  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    mode: "quick",
    contentType: "search",
    isLoading: false,
    messages: [],
    hasSearched: false,
    rateLimitInfo: null,
    imageRateLimit: null,
    boardroomMode: false,
    boardType: "startup",
  })

  const [uiState, setUIState] = useState({
    showHistory: false,
    showBookmarks: false,
    isDrawerOpen: false,
    isSidebarCollapsed: true,
    sidebarLoaded: false,
  })

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return threadStorage.getCurrentThreadId()
    }
    return null
  })

  const [selectedModel, setSelectedModel] = useState<ModelId>(() => {
    if (initialModelPreference?.model_preference === "manual" && initialModelPreference?.selected_model) {
      return initialModelPreference.selected_model as ModelId
    }
    return "auto"
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<SearchInputRef>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    initialHistory.slice(0, 10).map((h) => h.query),
  )
  const [bookmarks, setBookmarks] = useState(initialBookmarks)

  const [showRateLimitNotification, setShowRateLimitNotification] = useState(false)
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null)

  const [showCouncilSelector, setShowCouncilSelector] = useState(false)
  const [selectedCouncilId, setSelectedCouncilId] = useState<string | null>(null)
  const [councilMode, setCouncilMode] = useState(false)

  useEffect(() => {
    if (searchState.rateLimitInfo) {
      const { remaining, limit } = searchState.rateLimitInfo
      
      // Show notification when approaching limit
      if (remaining <= 10 && remaining > 0) {
        setShowRateLimitNotification(true)
        
        // Calculate reset time (24 hours from now if not provided)
        const resetTime = new Date()
        resetTime.setHours(resetTime.getHours() + 24)
        setRateLimitResetTime(resetTime)
      } else if (remaining === 0) {
        setShowRateLimitNotification(true)
        
        const resetTime = new Date()
        resetTime.setHours(resetTime.getHours() + 24)
        setRateLimitResetTime(resetTime)
      } else {
        setShowRateLimitNotification(false)
      }
    }
  }, [searchState.rateLimitInfo])

  useEffect(() => {
    storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, recentSearches)
  }, [recentSearches])

  const handleToggleMode = useCallback(() => {
    dispatchSearch({ type: "SET_MODE", mode: searchState.mode === "quick" ? "deep" : "quick" })
  }, [searchState.mode])

  const handleToggleHistory = useCallback(() => {
    setUIState((prev) => ({ ...prev, showHistory: !prev.showHistory }))
  }, [])

  const handleToggleBookmarks = useCallback(() => {
    setUIState((prev) => ({ ...prev, showBookmarks: !prev.showBookmarks }))
  }, [])

  const handleSelectThread = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}`)
      if (!res.ok) {
        toast.error("Failed to load conversation")
        return
      }

      const data = await res.json()
      const messages = data.messages

      if (!messages || messages.length === 0) {
        toast.info("This conversation has no messages")
        return
      }

      dispatchSearch({ type: "CLEAR_SEARCH" })
      setCurrentThreadId(threadId)

      if (messages.length > 0) {
        dispatchSearch({ type: "LOAD_FROM_HISTORY", history: messages[0] })

        for (let i = 1; i < messages.length; i++) {
          const msg = messages[i]
          dispatchSearch({ type: "START_SEARCH", query: msg.query, mode: msg.mode || "quick" })

          if (msg.response) {
            dispatchSearch({ type: "UPDATE_CURRENT_RESPONSE", response: msg.response })
          }

          if (msg.citations) {
            dispatchSearch({ type: "SET_CURRENT_CITATIONS", citations: msg.citations })
          }

          if (msg.model_used) {
            dispatchSearch({
              type: "SET_CURRENT_MODEL_INFO",
              modelInfo: {
                model: msg.model_used,
                reason: msg.selection_reason || "",
                autoSelected: msg.auto_selected ?? true,
              },
            })
          }

          dispatchSearch({ type: "SEARCH_COMPLETE" })
        }
      }

      setUIState((prev) => ({
        ...prev,
        showHistory: false,
        showBookmarks: false,
        isDrawerOpen: false,
      }))

      toast.success("Conversation loaded")
    } catch (error) {
      console.error("Failed to load thread:", error)
      toast.error("Failed to load conversation")
    }
  }, [])

  const handleModelChange = async (newModel: ModelId) => {
    setSelectedModel(newModel)

    try {
      const response = await fetch("/api/model-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          modelPreference: newModel === "auto" ? "auto" : "manual",
          selectedModel: newModel === "auto" ? null : newModel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save preference")
      }
    } catch (error) {
      logger.error("Failed to update model preference", { error })
      toast.error("Failed to save preference", "Your model preference couldn't be saved. It will reset on refresh.")
    }
  }

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      dispatchSearch({ type: "SEARCH_ERROR", error: "" })
      dispatchSearch({ type: "SEARCH_COMPLETE" })
    }
  }

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleClearSearch = () => {
    dispatchSearch({ type: "CLEAR_SEARCH" })
  }

  const handleSearch = useCallback(
    async (query: string, searchMode: SearchMode, attachments?: Attachment[]) => {
      if (searchState.isLoading) {
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      dispatchSearch({ type: "START_SEARCH", query, mode: searchMode })

      try {
        const body: any = { query, mode: searchMode, userId: user.id }

        if (currentThreadId) {
          body.threadId = currentThreadId
        }

        if (selectedModel !== "auto") {
          body.selectedModel = selectedModel
        }

        if (attachments && attachments.length > 0) {
          body.attachments = attachments
        }

        if (searchState.messages.length > 0 && currentThreadId) {
          body.conversationHistory = searchState.messages
            .slice(-10)
            .map((msg) => ({
              role: msg.type === "search" ? "user" : "assistant",
              content: msg.type === "search" ? msg.query : msg.response || "",
            }))
            .filter((msg) => msg.content.trim().length > 0)
        }

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        })

        if (res.status === 429) {
          const errorData = await res.json()
          const errorMessage = handleSearchError({
            error: errorData,
            user,
            status: res.status,
          })
          dispatchSearch({ type: "SEARCH_ERROR", error: errorMessage })
          return
        }

        if (!res.ok) {
          const errorData = await res.json()
          const errorMessage = handleSearchError({
            error: errorData,
            user,
            status: res.status,
          })
          dispatchSearch({ type: "SEARCH_ERROR", error: errorMessage })
          return
        }

        const threadId = res.headers.get("X-Thread-Id")
        if (threadId) {
          setCurrentThreadId(threadId)
        }

        const remaining = res.headers.get("X-RateLimit-Remaining")
        const limit = res.headers.get("X-RateLimit-Limit")
        if (remaining && limit) {
          dispatchSearch({
            type: "SET_RATE_LIMIT",
            rateLimitInfo: { remaining: Number.parseInt(remaining), limit: Number.parseInt(limit) },
          })
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        let accumulatedResponse = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)

                if (parsed.type === "text") {
                  accumulatedResponse += parsed.content
                  dispatchSearch({ type: "UPDATE_CURRENT_RESPONSE", response: accumulatedResponse })
                } else if (parsed.type === "citations") {
                  dispatchSearch({ type: "SET_CURRENT_CITATIONS", citations: parsed.content || parsed.citations || [] })
                } else if (parsed.type === "model") {
                  dispatchSearch({
                    type: "SET_CURRENT_MODEL_INFO",
                    modelInfo: {
                      model: parsed.content?.model || parsed.model,
                      reason: parsed.content?.reason || parsed.reason,
                      autoSelected: parsed.content?.autoSelected ?? parsed.autoSelected ?? true,
                    },
                  })
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }

        dispatchSearch({ type: "SEARCH_COMPLETE" })

        const searchId = res.headers.get("X-Search-Id")
        if (searchId) {
          dispatchSearch({ type: "SET_SEARCH_ID", searchId })
        }

        if (searchMode === "deep") {
          dispatchSearch({ type: "SET_MODE", mode: "quick" })
        }

        searchInputRef.current?.clear()

        setRecentSearches((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 10))
      } catch (error: any) {
        if (error.name === "AbortError") {
          return
        }

        toast.error("Search failed", error.message || "Please try again")
        dispatchSearch({ type: "SEARCH_ERROR", error: "Sorry, something went wrong. Please try again." })
      } finally {
        abortControllerRef.current = null
      }
    },
    [user, selectedModel, searchState.isLoading, currentThreadId, searchState.messages],
  )

  const handleImageGeneration = useCallback(
    async (prompt: string) => {
      if (searchState.isLoading) {
        return
      }

      dispatchSearch({ type: "START_IMAGE_GENERATION", prompt })

      try {
        const body: any = { prompt, userId: user.id }

        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const errorData = await res.json()
          const errorMessage = handleImageError({
            error: errorData,
            status: res.status,
          })
          dispatchSearch({ type: "SEARCH_ERROR", error: errorMessage })
          return
        }

        const data = await res.json()

        dispatchSearch({
          type: "SET_GENERATED_IMAGE",
          image: data.image,
          rateLimit: data.rateLimit,
        })

        toast.success("Image generated successfully!")
        searchInputRef.current?.clear()
      } catch (error: any) {
        toast.error("Image generation failed", error.message || "Please try again")
        dispatchSearch({ type: "SEARCH_ERROR", error: "Sorry, image generation failed. Please try again." })
      }
    },
    [user, searchState.isLoading],
  )

  const handleBoardroomModeChange = useCallback((enabled: boolean) => {
    dispatchSearch({ type: "SET_BOARDROOM_MODE", enabled })
  }, [])

  const handleBoardroomSearch = useCallback(
    async (query: string, boardType: string) => {
      if (searchState.isLoading) {
        return
      }

      dispatchSearch({ type: "START_BOARDROOM", query, boardType: boardType as BoardType })

      try {
        const body: any = {
          query,
          boardType,
          userId: user.id,
          threadId: currentThreadId || undefined,
        }

        const res = await fetch("/api/boardroom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const errorData = await res.json()
          toast.error("Boardroom failed", errorData.error || "Please try again")
          dispatchSearch({ type: "SEARCH_ERROR", error: errorData.error || "Boardroom request failed" })
          return
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)

                if (parsed.type === "session_start") {
                  dispatchSearch({
                    type: "SET_BOARDROOM_SESSION",
                    sessionId: parsed.sessionId,
                    personas: parsed.personas.map((p: any) => ({
                      name: p.name,
                      role: p.role,
                      avatar: p.avatar,
                      model: p.model || 'Unknown',
                    })),
                  })
                } else if (parsed.type === "persona_chunk") {
                  dispatchSearch({
                    type: "UPDATE_BOARDROOM_RESPONSE",
                    persona: parsed.persona,
                    round: parsed.round,
                    content: parsed.content,
                  })
                } else if (parsed.type === "synthesis_chunk") {
                  dispatchSearch({
                    type: "SET_BOARDROOM_SYNTHESIS",
                    content: parsed.content,
                  })
                }
              } catch (e) {
                console.error("[v0] Failed to parse boardroom chunk:", e)
              }
            }
          }
        }

        dispatchSearch({ type: "SEARCH_COMPLETE" })
        searchInputRef.current?.clear()
      } catch (error: any) {
        console.error("[v0] Boardroom error:", error)
        toast.error("Boardroom failed", error.message || "Please try again")
        dispatchSearch({ type: "SEARCH_ERROR", error: "Sorry, boardroom mode failed. Please try again." })
      }
    },
    [user, searchState.isLoading, currentThreadId],
  )

  const handleSearchOrGenerate = useCallback(
    (query: string, searchMode: SearchMode, attachments?: Attachment[]) => {
      if (councilMode) {
        // Handle council search logic here
        console.log("Council search logic not implemented yet")
      } else if (searchState.contentType === "image") {
        handleImageGeneration(query)
      } else {
        handleSearch(query, searchMode, attachments)
      }
    },
    [councilMode, searchState.contentType, handleImageGeneration, handleSearch],
  )

  const handleLogout = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        storage.removeItem("miami_user_cache")
        console.log("[v0] Cleared user cache from localStorage")
      }
      
      const formData = new FormData()
      await fetch("/api/auth/logout", { method: "POST", body: formData })
      
      window.location.href = "/"
    } catch (error) {
      toast.error("Failed to log out")
    }
  }, [])

  const handleNewChat = useCallback(() => {
    handleCancelSearch()
    handleClearSearch()

    setCurrentThreadId(null)

    setUIState((prev) => ({ ...prev, isDrawerOpen: false }))
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 300)
  }, [])

  const isAdmin = useMemo(() => user?.role === "owner" || user?.role === "admin", [user?.role])

  const lastMessage = useMemo(() => {
    return searchState.messages.length > 0 ? searchState.messages[searchState.messages.length - 1] : null
  }, [searchState.messages])

  const handleRegenerate = useCallback(() => {
    if (lastMessage) {
      handleSearch(lastMessage.query, searchState.mode)
    }
  }, [lastMessage, handleSearch, searchState.mode])

  const handleContentTypeChange = useCallback((type: ContentType) => {
    dispatchSearch({ type: "SET_CONTENT_TYPE", contentType: type })
  }, [])

  useEffect(() => {
    if (!uiState.isSidebarCollapsed && !uiState.sidebarLoaded) {
      setUIState((prev) => ({ ...prev, sidebarLoaded: true }))
    }
  }, [uiState.isSidebarCollapsed, uiState.sidebarLoaded])

  const handleCouncilModeChange = useCallback((enabled: boolean) => {
    if (enabled) {
      // Open the council selector dialog
      setShowCouncilSelector(true)
    } else {
      // Disable council mode
      setCouncilMode(false)
      setSelectedCouncilId(null)
    }
  }, [])

  const handleSelectCouncil = useCallback((councilId: string | 'quick') => {
    console.log("[v0] Council selected:", councilId)
    setSelectedCouncilId(councilId)
    setCouncilMode(true)
    setShowCouncilSelector(false)
    
    // Auto-focus the search input after selection
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }, [])

  return (
    <>
      <CouncilSelectorDialog
        open={showCouncilSelector}
        onOpenChange={setShowCouncilSelector}
        onSelectCouncil={handleSelectCouncil}
        userId={user.id}
      />

      {showRateLimitNotification && searchState.rateLimitInfo && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className={`rounded-lg p-4 shadow-lg border ${
            searchState.rateLimitInfo.remaining === 0 
              ? 'bg-red-500/10 border-red-500/50' 
              : 'bg-yellow-500/10 border-yellow-500/50'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {searchState.rateLimitInfo.remaining === 0 
                    ? '⚠️ Rate Limit Reached' 
                    : `⚠️ ${searchState.rateLimitInfo.remaining} queries remaining`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rateLimitResetTime && `Resets ${rateLimitResetTime.toLocaleTimeString()}`}
                </p>
              </div>
              <button
                onClick={() => setShowRateLimitNotification(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <KeyboardShortcuts
        onSearch={handleFocusSearch}
        onClear={handleClearSearch}
        onToggleMode={handleToggleMode}
        onToggleHistory={handleToggleHistory}
        onNewChat={handleNewChat}
        onToggleBookmarks={handleToggleBookmarks}
      />

      <CollapsibleSidebar
        user={user}
        isLoadingUser={false}
        recentSearches={recentSearches}
        onNewChat={handleNewChat}
        onSearchSelect={(search) => handleSearch(search, searchState.mode)}
        onToggleHistory={handleToggleHistory}
        onToggleBookmarks={handleToggleBookmarks}
        onSelectThread={handleSelectThread}
        onLogout={handleLogout}
        isCollapsed={uiState.isSidebarCollapsed}
        setIsCollapsed={(collapsed) => setUIState((prev) => ({ ...prev, isSidebarCollapsed: collapsed }))}
        shouldLoadThreads={uiState.sidebarLoaded}
      />

      <div className="min-h-screen flex flex-col">
        {searchState.hasSearched && (
          <div className="fixed inset-x-0 top-0 h-26 md:h-32 bg-gradient-to-b from-background via-background to-transparent pointer-events-none z-40" />
        )}

        <PageHeader
          hasSearched={searchState.hasSearched}
          isAuthenticated={true}
          isSidebarCollapsed={uiState.isSidebarCollapsed}
          isDrawerOpen={uiState.isDrawerOpen}
          onOpenChange={(open) => setUIState((prev) => ({ ...prev, isDrawerOpen: open }))}
          isAdmin={isAdmin}
          recentSearches={recentSearches}
          bookmarks={bookmarks}
          user={user}
          isLoadingUser={false}
          theme={theme || "dark"}
          setTheme={setTheme}
          handleNewChat={handleNewChat}
          handleToggleHistory={handleToggleHistory}
          handleToggleBookmarks={handleToggleBookmarks}
          handleSearch={handleSearchOrGenerate}
          searchMode={searchState.mode}
        />

        <main
          id="main-content"
          className={`flex-1 ${searchState.hasSearched ? "container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 pb-36 md:pb-32 pt-20 md:pt-24" : "pt-20 md:pt-24"}`}
        >
          {!searchState.hasSearched ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-center mb-4"></div>

              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple bg-clip-text text-transparent">
                  Hello, {user.name || "there"}
                </h1>
                <p className="text-base text-muted-foreground">How can I help you today?</p>
              </div>

              <div className="w-full max-w-3xl px-4">
                <ExampleQueries
                  onQueryClick={(query) => handleSearchOrGenerate(query, searchState.mode)}
                  variant="compact"
                />
              </div>
            </div>
          ) : (
            <ConversationView
              messages={searchState.messages}
              messageRefs={messageRefs}
              user={user}
              searchMode={searchState.mode}
              onRegenerate={handleRegenerate}
              onRelatedSearchClick={(search) => handleSearch(search, searchState.mode)}
              onImageRegenerate={handleImageGeneration}
            />
          )}
        </main>

        {uiState.showHistory && (
          <Suspense fallback={<div className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border" />}>
            <HistorySidebar
              userId={user.id}
              onClose={() => setUIState((prev) => ({ ...prev, showHistory: false }))}
              onSelectThread={handleSelectThread}
              localThreads={recentSearches}
              isOpen={uiState.showHistory}
            />
          </Suspense>
        )}

        {uiState.showBookmarks && (
          <Suspense fallback={<div className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border" />}>
            <BookmarksSidebar
              userId={user.id}
              onClose={() => setUIState((prev) => ({ ...prev, showBookmarks: false }))}
              onSelectBookmark={(query) => handleSearch(query, searchState.mode)}
              isOpen={uiState.showBookmarks}
            />
          </Suspense>
        )}

        <SearchFormContainer
          searchInputRef={searchInputRef}
          onSearch={handleSearchOrGenerate}
          isLoading={searchState.isLoading}
          mode={searchState.mode}
          onModeChange={(mode) => dispatchSearch({ type: "SET_MODE", mode })}
          onCancel={handleCancelSearch}
          recentSearches={recentSearches}
          user={user}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onHistoryClick={handleToggleHistory}
          contentType={searchState.contentType}
          onContentTypeChange={handleContentTypeChange}
          rateLimitInfo={searchState.rateLimitInfo}
          imageRateLimit={searchState.imageRateLimit}
          isSidebarCollapsed={uiState.isSidebarCollapsed}
          hasSearched={searchState.hasSearched}
          isCouncilMode={councilMode}
          onCouncilModeChange={handleCouncilModeChange}
          selectedCouncilId={selectedCouncilId}
        />
      </div>
    </>
  )
}
