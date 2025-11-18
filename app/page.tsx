"use client"

import { useState, useRef, useEffect, useCallback, useReducer, Suspense, useMemo } from "react"
import { SearchInput } from "@/components/search-input"
import { HistorySidebar } from "@/components/history-sidebar"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import type { ModelId } from "@/components/model-selector"
import Image from "next/image"
import type { SearchHistory } from "@/lib/db"
import { toast } from "@/lib/toast"
import { ErrorBoundary } from "@/components/error-boundary"
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
import Link from "next/link"
import { Logo } from "@/components/logo"
import { FancyGlowingButton } from "@/components/fancy-glowing-button"
import { SignupBenefitsCard } from "@/components/signup-benefits-card"
import { getCurrentUser } from "@/lib/auth"
import { getSearchHistory, getModelPreference } from "@/lib/db"
import { UnauthenticatedLanding } from "@/components/landing/unauthenticated-landing"
import { AuthenticatedLanding } from "@/components/landing/authenticated-landing"
import { sql } from "@/lib/db"
import { MiamiLoader } from "@/components/miami-loader"

const NON_AUTH_DEFAULT_MODEL: ModelId = "openai/gpt-4o-mini"

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
    default:
      return state
  }
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [modelPreference, setModelPreference] = useState<any>(null)
  const [initialBookmarks, setInitialBookmarks] = useState<
    Array<{ id: string; query: string; response: string; created_at: string }>
  >([])

  const { theme, setTheme } = useTheme()

  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [connectionType, setConnectionType] = useState<'fast' | 'medium' | 'slow'>('medium')
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    mode: "quick",
    contentType: "search",
    isLoading: false,
    messages: [],
    hasSearched: false,
    rateLimitInfo: null,
    imageRateLimit: null,
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

  const [isLoadingUser, setIsLoadingUser] = useState(() => {
    if (typeof window !== "undefined") {
      const cachedData = storage.getItem("miami_user_cache", null)
      return !cachedData // Only show loading if no cache exists
    }
    return true
  })

  const [selectedModel, setSelectedModel] = useState<ModelId>(NON_AUTH_DEFAULT_MODEL)

  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<SearchInputRef>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [recentSearches, setRecentSearches] = useState<string[]>([])

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
      const messages = data.messages // API returns { messages: SearchHistory[] }

      if (!messages || messages.length === 0) {
        toast.info("This conversation has no messages")
        return
      }

      // Clear current search state
      dispatchSearch({ type: "CLEAR_SEARCH" })
      setCurrentThreadId(threadId)

      // Convert thread messages to conversation messages format
      const conversationMessages = messages.map((message: SearchHistory) => ({
        id: message.id || Date.now().toString(),
        type: message.generated_image ? "image" : "search",
        query: message.query,
        response: message.response,
        citations: message.citations || [],
        modelInfo: message.model_used
          ? {
              model: message.model_used,
              reason: message.selection_reason || "",
              autoSelected: message.auto_selected ?? true,
            }
          : undefined,
        generatedImage: message.generated_image || undefined,
        isStreaming: false,
      }))

      // Load the first message using LOAD_FROM_HISTORY, then set the rest directly
      if (conversationMessages.length > 0) {
        dispatchSearch({ type: "LOAD_FROM_HISTORY", history: messages[0] })

        // For additional messages, we need to add them to state
        // Since we don't have a direct action for this, we'll dispatch START_SEARCH and complete for each
        for (let i = 1; i < messages.length; i++) {
          const msg = messages[i]
          dispatchSearch({
            type: "START_SEARCH",
            query: msg.query,
            mode: msg.mode || "quick",
          })

          if (msg.response) {
            dispatchSearch({
              type: "UPDATE_CURRENT_RESPONSE",
              response: msg.response,
            })
          }

          if (msg.citations) {
            dispatchSearch({
              type: "SET_CURRENT_CITATIONS",
              citations: msg.citations,
            })
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

      // Close sidebars after loading thread
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

  useEffect(() => {
    async function loadInitialData() {
      const cachedUserData = typeof window !== "undefined" ? storage.getItem("miami_user_cache", null) : null
      
      if (cachedUserData && cachedUserData.user && cachedUserData.timestamp) {
        const cacheAge = Date.now() - cachedUserData.timestamp
        const isExpired = cacheAge > (60 * 60 * 1000) // 1 hour
        
        if (!isExpired) {
          console.log('[v0] Loading from valid cache for instant display')
          setUser(cachedUserData.user)
          setHistory(cachedUserData.history || [])
          setModelPreference(cachedUserData.modelPreference)
          setInitialBookmarks(cachedUserData.bookmarks || [])
          
          const recent = (cachedUserData.history || []).slice(0, 10).map((h: SearchHistory) => h.query)
          setRecentSearches(recent)
          
          if (cachedUserData.modelPreference?.model_preference === "manual" && cachedUserData.modelPreference.selected_model) {
            setSelectedModel(cachedUserData.modelPreference.selected_model as ModelId)
          } else {
            setSelectedModel("auto")
          }
        } else {
          console.log('[v0] Cache expired, clearing')
          storage.removeItem("miami_user_cache")
        }
      }

      try {
        const res = await fetch(`/api/init?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)

          if (data.user) {
            setHistory(data.history || [])
            setModelPreference(data.modelPreference)
            setInitialBookmarks(data.bookmarks || [])

            const recent = (data.history || []).slice(0, 10).map((h: SearchHistory) => h.query)
            setRecentSearches(recent)

            if (data.modelPreference?.model_preference === "manual" && data.modelPreference.selected_model) {
              setSelectedModel(data.modelPreference.selected_model as ModelId)
            } else {
              setSelectedModel("auto")
            }
            
            if (typeof window !== "undefined") {
              storage.setItem("miami_user_cache", {
                user: data.user,
                history: data.history,
                modelPreference: data.modelPreference,
                bookmarks: data.bookmarks,
                timestamp: Date.now(),
              })
            }
          } else {
            if (typeof window !== "undefined") {
              storage.removeItem("miami_user_cache")
            }
            
            if (typeof window !== "undefined") {
              const storedModel = storage.getItem(STORAGE_KEYS.MODEL_PREFERENCE, null)
              if (storedModel) {
                setSelectedModel(storedModel as ModelId)
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load initial data:", error)
        if (typeof window !== "undefined") {
          storage.removeItem("miami_user_cache")
        }
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh user state
        fetch("/api/init")
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setUser(data.user)
            }
          })
          .catch(err => console.error('Failed to refresh user state:', err))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleModelChange = async (newModel: ModelId) => {
    setSelectedModel(newModel)

    if (!user?.id) {
      if (typeof window !== "undefined") {
        storage.setItem(STORAGE_KEYS.MODEL_PREFERENCE, newModel)
      }
      return
    }

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
      dispatchSearch({ type: "SEARCH_ERROR", error: "" }) // Clear any ongoing response
      dispatchSearch({ type: "SEARCH_COMPLETE" }) // Ensure loading is set to false
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

      let effectiveThreadId = currentThreadId
      if (!user?.id && !effectiveThreadId) {
        effectiveThreadId = `local-thread-${Date.now()}`
        setCurrentThreadId(effectiveThreadId)
        threadStorage.setCurrentThreadId(effectiveThreadId)

        const newThread = {
          id: effectiveThreadId,
          title: query.slice(0, 50),
          queries: [],
          lastMessageAt: Date.now(),
          messageCount: 0,
        }
        threadStorage.addThread(newThread)
      }

      dispatchSearch({ type: "START_SEARCH", query, mode: searchMode })

      try {
        const body: any = { query, mode: searchMode }

        if (user?.id) {
          body.userId = user.id
          if (currentThreadId) {
            body.threadId = currentThreadId
          }
        }

        if (selectedModel !== "auto") {
          body.selectedModel = selectedModel
        }

        if (attachments && attachments.length > 0) {
          body.attachments = attachments
        }

        if (searchState.messages.length > 0 && currentThreadId) {
          const contextLimit = user?.id ? 10 : 5
          body.conversationHistory = searchState.messages
            .slice(-contextLimit)
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
        const searchId = res.headers.get("X-Search-Id")

        if (!user?.id && effectiveThreadId) {
          const thread = threadStorage.getThread(effectiveThreadId)
          if (thread) {
            threadStorage.updateThread(effectiveThreadId, {
              queries: [...thread.queries, query],
              lastMessageAt: Date.now(),
              messageCount: thread.messageCount + 1,
            })
          }

          if (thread && thread.messageCount === 0) {
            generateThreadTitle(effectiveThreadId, query)
          }
        } else if (user?.id && threadId) {
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
        const body: any = { prompt, userId: user?.id }

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

  const handleSearchOrGenerate = useCallback(
    (query: string, searchMode: SearchMode, attachments?: Attachment[]) => {
      if (searchState.contentType === "image") {
        handleImageGeneration(query)
      } else {
        handleSearch(query, searchMode, attachments)
      }
    },
    [searchState.contentType, handleImageGeneration, handleSearch],
  )

  const handleSelectHistory = (history: SearchHistory) => {
    if (!history.response || history.response.trim() === "") {
      handleSearch(history.query, history.mode)
      return
    }

    dispatchSearch({ type: "LOAD_FROM_HISTORY", history })
    toast.info("Loaded from history")
  }

  const handleLogout = async () => {
    try {
      const formData = new FormData()
      await fetch("/api/auth/logout", { method: "POST", body: formData })
      
      if (typeof window !== "undefined") {
        storage.removeItem("miami_user_cache")
        console.log("[v0] Cleared user cache from localStorage")
      }
      
      setUser(null)
      toast.success("Logged out successfully")
      setUIState((prev) => ({ ...prev, isDrawerOpen: false }))
    } catch (error) {
      toast.error("Failed to log out")
    }
  }

  const handleNewChat = useCallback(() => {
    handleCancelSearch()
    handleClearSearch()

    setCurrentThreadId(null)
    if (!user?.id) {
      threadStorage.clearCurrentThread()
    }

    setUIState((prev) => ({ ...prev, isDrawerOpen: false }))
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 300)
  }, [user])

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

  const handleFeatureAction = useCallback((query: string, actionMode: SearchMode) => {
    if (actionMode === "deep" && !query) {
      dispatchSearch({ type: "SET_MODE", mode: "deep" })
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else if (query) {
      dispatchSearch({ type: "SET_MODE", mode: actionMode })
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [])

  useEffect(() => {
    const messages = searchState.messages
    const currentMessageCount = messages.length

    const currentMessageIds = new Set(messages.map((m) => m.id))
    Object.keys(messageRefs.current).forEach((id) => {
      if (!currentMessageIds.has(id)) {
        delete messageRefs.current[id]
      }
    })

    if (currentMessageCount > 0) {
      const latestMessage = messages[currentMessageCount - 1]
      const messageElement = messageRefs.current[latestMessage.id]

      if (messageElement) {
        const scrollThreshold = 150
        const isNearBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - scrollThreshold

        if (isNearBottom) {
          requestAnimationFrame(() => {
            const headerOffset = 100
            const elementPosition = messageElement.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            })
          })
        }
      }
    }
  }, [searchState.messages])

  useEffect(() => {
    if (searchState.hasSearched) {
      // Placeholder for effect logic
    }
  }, [searchState.hasSearched])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!uiState.isSidebarCollapsed && !uiState.sidebarLoaded) {
      setUIState((prev) => ({ ...prev, sidebarLoaded: true }))
    }
  }, [uiState.isSidebarCollapsed, uiState.sidebarLoaded])

  const generateThreadTitle = async (threadId: string, query: string) => {
    try {
      const response = await fetch("/api/generate-thread-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const { title } = await response.json()
        threadStorage.updateThread(threadId, { title })
      }
    } catch (error) {
      console.error("Failed to generate thread title:", error)
    }
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Check connection type using Network Information API
    const detectConnection = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection
        const effectiveType = conn?.effectiveType || 'unknown'
        const saveData = conn?.saveData || false

        console.log('[v0] Connection detected:', { effectiveType, saveData })

        // If user has data saver enabled, don't load video
        if (saveData) {
          console.log('[v0] Data saver enabled - showing static image only')
          setConnectionType('slow')
          setShouldLoadVideo(false)
          return
        }

        // Determine connection speed
        if (effectiveType === '4g' || effectiveType === 'wifi') {
          console.log('[v0] Fast connection - loading video immediately')
          setConnectionType('fast')
          setShouldLoadVideo(true)
        } else if (effectiveType === '3g') {
          console.log('[v0] Medium connection - will load video after image')
          setConnectionType('medium')
          // Delay video load by 2 seconds to show image first
          setTimeout(() => setShouldLoadVideo(true), 2000)
        } else {
          console.log('[v0] Slow connection - showing static image only')
          setConnectionType('slow')
          setShouldLoadVideo(false)
        }
      } else {
        // API not supported, use safe default: load image first, then video
        console.log('[v0] Network API not supported - using safe default')
        setConnectionType('medium')
        setTimeout(() => setShouldLoadVideo(true), 2000)
      }
    }

    detectConnection()

    // Listen for connection changes
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      conn?.addEventListener('change', detectConnection)
      return () => {
        conn?.removeEventListener('change', detectConnection)
        window.removeEventListener('resize', checkMobile)
      }
    }

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <ErrorBoundary>
      {isLoadingUser ? (
        <MiamiLoader />
      ) : user ? (
        <AuthenticatedLanding
          user={{
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "user",
          }}
          initialHistory={history}
          initialModelPreference={modelPreference}
          initialBookmarks={initialBookmarks}
        />
      ) : (
        <UnauthenticatedLanding />
      )}
    </ErrorBoundary>
  )
}
