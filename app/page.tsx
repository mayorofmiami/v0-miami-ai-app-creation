"use client"

import { useState, useRef, useEffect, useCallback, useReducer, Suspense } from "react"
import { SearchInput } from "@/components/search-input"
import { SearchResponse } from "@/components/search-response"
import { HistorySidebar } from "@/components/history-sidebar"
import { RelatedSearches } from "@/components/related-searches"
import { ImageResult } from "@/components/image-result"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import type { ModelId } from "@/components/model-selector"
import { ModelBadge } from "@/components/model-badge"
import Image from "next/image"
import type { SearchHistory } from "@/lib/db"
import { toast } from "@/lib/toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { SkeletonSearch } from "@/components/skeleton-search"
import { generateRelatedSearches } from "@/lib/search-suggestions"
import type { SearchInputRef } from "@/components/search-input"
import { ResponseActions } from "@/components/response-actions"
import { useTheme } from "next-themes"
import type { Attachment } from "@/types" // Import Attachment type
import { ExampleQueries } from "@/components/example-queries"
import { PageHeader } from "@/components/page-header"

type ConversationMessage = {
  id: string
  type: "search" | "image"
  query: string
  response?: string
  citations?: Array<{ title: string; url: string; snippet: string }>
  modelInfo?: { model: string; reason: string; autoSelected: boolean }
  relatedSearches?: string[]
  generatedImage?: {
    url: string
    prompt: string
    model: string
    resolution: string
    createdAt: string
  }
  attachments?: Attachment[] // Add attachments field
  isStreaming?: boolean
}

type SearchState = {
  mode: "quick" | "deep"
  contentType: "search" | "image"
  isLoading: boolean
  messages: ConversationMessage[]
  hasSearched: boolean
  rateLimitInfo: { remaining: number; limit: number } | null
  imageRateLimit: { currentCount: number; limit: number; remaining: number } | null
}

type SearchAction =
  | { type: "START_SEARCH"; query: string; mode: "quick" | "deep" }
  | { type: "START_IMAGE_GENERATION"; prompt: string }
  | { type: "UPDATE_CURRENT_RESPONSE"; response: string }
  | { type: "SET_CURRENT_CITATIONS"; citations: Array<{ title: string; url: string; snippet: string }> }
  | { type: "SET_CURRENT_MODEL_INFO"; modelInfo: { model: string; reason: string; autoSelected: boolean } }
  | { type: "SET_CURRENT_RELATED_SEARCHES"; relatedSearches: string[] }
  | { type: "SET_GENERATED_IMAGE"; image: any; rateLimit: any }
  | { type: "SET_RATE_LIMIT"; rateLimitInfo: { remaining: number; limit: number } }
  | { type: "SEARCH_COMPLETE" }
  | { type: "SEARCH_ERROR"; error: string }
  | { type: "CLEAR_SEARCH" }
  | { type: "SET_MODE"; mode: "quick" | "deep" }
  | { type: "SET_CONTENT_TYPE"; contentType: "search" | "image" }
  | { type: "LOAD_FROM_HISTORY"; history: any }

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
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 ? { ...msg, relatedSearches: action.relatedSearches } : msg,
        ),
      }
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
            relatedSearches: generateRelatedSearches(action.history.query),
            generatedImage: action.history.generated_image || undefined,
            isStreaming: false,
          },
        ],
      }
    default:
      return state
  }
}

export default function Home() {
  const { theme, setTheme } = useTheme()

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
    isDrawerOpen: false,
    isSidebarCollapsed: true,
  })

  // User state
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role?: string } | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [selectedModel, setSelectedModel] = useState<ModelId>("auto")
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<SearchInputRef>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const userHasScrolledRef = useRef(false)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch("/api/init")
        const data = await res.json()

        // Set user
        setUser(data.user)

        // Set recent searches if user exists
        if (data.user && data.history) {
          const recent = data.history.slice(0, 10).map((h: SearchHistory) => h.query)
          setRecentSearches(recent)
        }

        // Set model preference if exists
        if (data.user && data.modelPreference) {
          if (data.modelPreference.model_preference === "manual" && data.modelPreference.selected_model) {
            setSelectedModel(data.modelPreference.selected_model as ModelId)
          }
        }
      } catch (error) {
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (window.location.hash === "#history") {
      setUIState((prev) => ({ ...prev, showHistory: true }))
      // Clear the hash after opening
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [])

  const handleModelChange = async (newModel: ModelId) => {
    setSelectedModel(newModel)

    if (user?.id) {
      try {
        await fetch("/api/model-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            modelPreference: newModel === "auto" ? "auto" : "manual",
            selectedModel: newModel === "auto" ? null : newModel,
          }),
        })
      } catch (error) {}
    }
  }

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      dispatchSearch({ type: "SEARCH_ERROR", error: "" }) // Clear any ongoing response
      dispatchSearch({ type: "SEARCH_COMPLETE" }) // Ensure loading is set to false
      toast.info("Search canceled")
    }
  }

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleClearSearch = () => {
    dispatchSearch({ type: "CLEAR_SEARCH" })
  }

  const handleToggleMode = () => {
    const newMode = searchState.mode === "quick" ? "deep" : "quick"
    dispatchSearch({ type: "SET_MODE", mode: newMode })
    toast.info(`Switched to ${newMode === "quick" ? "Quick Search" : "Deep Research"} mode`)
  }

  const handleToggleHistory = useCallback(() => {
    setUIState((prev) => ({ ...prev, showHistory: !prev.showHistory }))
  }, [])

  const handleSearch = useCallback(
    async (query: string, searchMode: "quick" | "deep", attachments?: Attachment[]) => {
      if (searchState.isLoading) {
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      dispatchSearch({ type: "START_SEARCH", query, mode: searchMode })

      try {
        const body: any = { query, mode: searchMode }
        if (user?.id) {
          body.userId = user.id
        }

        if (selectedModel !== "auto") {
          body.selectedModel = selectedModel
        }

        if (attachments && attachments.length > 0) {
          body.attachments = attachments
        }

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        })

        if (res.status === 429) {
          const error = await res.json()

          if (error.type === "ai_gateway_rate_limit" || error.type === "ai_gateway_error") {
            toast.error(
              "AI Service Temporarily Limited",
              "Free AI credits have rate limits due to abuse. Please try again in a few minutes, or contact support to purchase AI credits.",
              10000,
            )
            dispatchSearch({
              type: "SEARCH_ERROR",
              error: `⚠️ **AI Service Temporarily Limited**
Vercel's free AI credits currently have rate limits in place due to abuse. This is a temporary measure while they work on a resolution.

**What you can do:**
- Wait a few minutes and try again
- Try a different AI model from the settings menu
- Contact support to purchase AI credits for unrestricted access

We apologize for the inconvenience!`,
            })
          } else {
            toast.error(
              "Rate Limit Exceeded",
              error.reason ||
                `You've reached your query limit. ${user ? "Limit: 100 queries per 24 hours" : "Sign in for more queries (100/day) or wait for your limit to reset."}`,
            )
            dispatchSearch({
              type: "SEARCH_ERROR",
              error: `⚠️ Rate limit exceeded. ${user ? "You've used all 100 queries for today." : "Sign in for 100 queries per day, or wait for your limit to reset (10 queries per 24 hours for unsigned users)."}`,
            })
          }
          return
        }

        if (!res.ok) {
          const error = await res.json()
          const errorMessage = error.error || "Search failed"

          if (res.status === 503 && errorMessage.includes("API key")) {
            toast.error("Configuration Error", "Please add TAVILY_API_KEY to environment variables in the Vars section")
            dispatchSearch({
              type: "SEARCH_ERROR",
              error: "⚠️ Search is not configured. Please add your TAVILY_API_KEY to the environment variables.",
            })
            return
          }

          throw new Error(errorMessage)
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
          if (done) {
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                continue
              }

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
                } else if (parsed.type === "related_searches") {
                  dispatchSearch({ type: "SET_CURRENT_RELATED_SEARCHES", relatedSearches: parsed.content || [] })
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }

        dispatchSearch({ type: "SEARCH_COMPLETE" })

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
    [user, selectedModel, searchState.isLoading],
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

        if (res.status === 429) {
          const error = await res.json()
          toast.error("Rate Limit Exceeded", error.message)
          dispatchSearch({
            type: "SEARCH_ERROR",
            error: `⚠️ ${error.message}`,
          })
          return
        }

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Image generation failed")
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
    (query: string, searchMode: "quick" | "deep", attachments?: Attachment[]) => {
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
      // If no response (local/unauthenticated history), re-run the search
      handleSearch(history.query, history.mode)
      return
    }

    // Load from history if response exists
    dispatchSearch({ type: "LOAD_FROM_HISTORY", history })
    toast.info("Loaded from history")
  }

  const handleLogout = async () => {
    try {
      const formData = new FormData()
      await fetch("/api/auth/logout", { method: "POST", body: formData })
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
    setUIState((prev) => ({ ...prev, isDrawerOpen: false }))
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }, [])

  const handleFeatureAction = useCallback((query: string, actionMode: "quick" | "deep") => {
    if (actionMode === "deep" && !query) {
      // Just switch to deep mode and focus input
      dispatchSearch({ type: "SET_MODE", mode: "deep" })
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else if (query) {
      // Focus input with pre-filled query
      dispatchSearch({ type: "SET_MODE", mode: actionMode })
      setTimeout(() => {
        searchInputRef.current?.focus()
        // Optionally pre-fill the query
        // This would require adding a prop to SearchInput to set initial value
      }, 100)
    }
  }, [])

  const handleRegenerate = () => {
    const lastMessage = searchState.messages[searchState.messages.length - 1]
    if (lastMessage) {
      handleSearch(lastMessage.query, searchState.mode)
    }
  }

  const handleVoiceSearch = () => {
    // Voice search logic would go here
    toast.info("Voice search coming soon!")
  }

  useEffect(() => {
    const handleScroll = () => {
      userHasScrolledRef.current = true
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    const messages = searchState.messages
    const currentMessageCount = messages.length

    if (currentMessageCount > 0) {
      const latestMessage = messages[currentMessageCount - 1]
      const messageElement = messageRefs.current[latestMessage.id]

      // Only auto-scroll if user hasn't manually scrolled
      if (messageElement && !userHasScrolledRef.current) {
        setTimeout(() => {
          const headerOffset = 100
          const elementPosition = messageElement.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          })
        }, 100)
      }
    }
  }, [searchState.messages])

  useEffect(() => {
    if (searchState.hasSearched) {
      userHasScrolledRef.current = false
    }
  }, [searchState.hasSearched])

  const isAdmin = user?.role === "owner" || user?.role === "admin"

  return (
    <ErrorBoundary>
      <KeyboardShortcuts
        onSearch={handleFocusSearch}
        onClear={handleClearSearch}
        onToggleMode={handleToggleMode}
        onToggleHistory={handleToggleHistory}
        onNewChat={handleNewChat}
      />

      <CollapsibleSidebar
        user={user}
        isLoadingUser={isLoadingUser}
        recentSearches={recentSearches}
        onNewChat={handleNewChat}
        onSearchSelect={(search) => handleSearch(search, searchState.mode)}
        onToggleHistory={handleToggleHistory}
        onLogout={handleLogout}
        isCollapsed={uiState.isSidebarCollapsed}
        setIsCollapsed={(collapsed) => setUIState((prev) => ({ ...prev, isSidebarCollapsed: collapsed }))}
      />

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${uiState.isSidebarCollapsed ? "md:ml-16" : "md:ml-64"}`}
      >
        {searchState.hasSearched && (
          <div className="fixed inset-x-0 top-0 h-26 md:h-32 bg-gradient-to-b from-background via-background to-transparent pointer-events-none z-40" />
        )}

        <PageHeader
          hasSearched={searchState.hasSearched}
          isAuthenticated={!!user}
          isSidebarCollapsed={uiState.isSidebarCollapsed}
          isDrawerOpen={uiState.isDrawerOpen}
          onDrawerOpenChange={(open) => setUIState((prev) => ({ ...prev, isDrawerOpen: open }))}
          isAdmin={isAdmin}
          recentSearches={recentSearches}
          user={user}
          isLoadingUser={isLoadingUser}
          theme={theme || "dark"}
          setTheme={setTheme}
          handleNewChat={handleNewChat}
          handleToggleHistory={handleToggleHistory}
          handleSearch={handleSearchOrGenerate}
          searchMode={searchState.mode}
        />

        {/* Main Content */}
        <main
          className={`flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-full overflow-x-hidden ${searchState.hasSearched ? "pb-36 md:pb-32 pt-20 md:pt-24" : user ? "pt-20 md:pt-24" : ""}`}
        >
          {!searchState.hasSearched ? (
            <>
              {!user && (
                <div className="flex flex-col items-center min-h-[calc(100vh-6rem)] space-y-8 md:space-y-8 animate-in fade-in duration-700 justify-center px-2">
                  <div className="text-center">
                    <div className="flex justify-center">
                      <Image
                        src="/miami-ai-logo.png"
                        alt="MIAMI.AI"
                        width={320}
                        height={64}
                        className="neon-glow max-w-full h-auto w-72 md:w-6/12"
                        priority
                      />
                    </div>
                  </div>

                  <div className="w-full max-w-3xl px-2 md:px-4 space-y-6 md:space-y-6">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <SearchInput
                          ref={searchInputRef}
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
                          onContentTypeChange={(type) =>
                            dispatchSearch({ type: "SET_CONTENT_TYPE", contentType: type })
                          }
                          onVoiceSearch={handleVoiceSearch}
                          hasHistory={recentSearches.length > 0}
                        />
                      </div>
                    </div>

                    <ExampleQueries
                      onQueryClick={(query) => handleSearchOrGenerate(query, searchState.mode)}
                      variant="default"
                    />
                  </div>
                </div>
              )}

              {user && (
                <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] space-y-8 sm:space-y-12 animate-in fade-in duration-700 justify-center pb-32">
                  <div className="flex justify-center mb-4"></div>

                  {/* Personalized Greeting */}
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
              )}
            </>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {searchState.messages.map((message, index) => (
                <div key={message.id} className="space-y-4">
                  <div
                    ref={(el) => {
                      messageRefs.current[message.id] = el
                    }}
                    className="w-full max-w-3xl mx-auto scroll-mt-24"
                  >
                    <div className="relative bg-gradient-to-r from-miami-aqua/10 via-miami-blue/10 to-miami-purple/10 rounded-2xl p-[2px] shadow-lg">
                      <div className="bg-background rounded-2xl px-4 md:px-5 py-4 flex items-start gap-3">
                        <svg
                          className="w-5 h-5 md:w-5 md:h-5 text-miami-aqua flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <p className="text-base md:text-base text-foreground/90 flex-1 leading-relaxed">
                          {message.query}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Response */}
                  {message.isStreaming && !message.response && !message.generatedImage ? (
                    <SkeletonSearch />
                  ) : message.response || message.generatedImage ? (
                    <>
                      <Suspense fallback={<SkeletonSearch />}>
                        {message.generatedImage ? (
                          <ImageResult
                            imageUrl={message.generatedImage.url}
                            prompt={message.generatedImage.prompt}
                            model={message.generatedImage.model}
                            resolution={message.generatedImage.resolution}
                            createdAt={message.generatedImage.createdAt}
                            onRegenerate={() => handleImageGeneration(message.generatedImage!.prompt)}
                          />
                        ) : (
                          <SearchResponse
                            response={message.response || ""}
                            citations={message.citations || []}
                            isStreaming={message.isStreaming || false}
                            actions={
                              !message.isStreaming && message.response && index === searchState.messages.length - 1 ? (
                                <ResponseActions
                                  query={message.query}
                                  response={message.response}
                                  searchId={undefined}
                                  userId={user?.id}
                                  onRegenerate={handleRegenerate}
                                />
                              ) : null
                            }
                            modelBadge={
                              user && message.modelInfo ? (
                                <ModelBadge
                                  model={message.modelInfo.model}
                                  reason={message.modelInfo.reason}
                                  autoSelected={message.modelInfo.autoSelected}
                                />
                              ) : null
                            }
                          />
                        )}
                      </Suspense>

                      {/* Related Searches - Only show for last message */}
                      {!message.isStreaming &&
                        message.response &&
                        !message.generatedImage &&
                        index === searchState.messages.length - 1 &&
                        message.relatedSearches &&
                        message.relatedSearches.length > 0 && (
                          <Suspense fallback={<div className="h-20" />}>
                            <RelatedSearches
                              searches={message.relatedSearches}
                              onSearchClick={(search) => handleSearch(search, searchState.mode)}
                            />
                          </Suspense>
                        )}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* History Sidebar */}
        {uiState.showHistory && (
          <Suspense fallback={<div className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border" />}>
            <HistorySidebar
              userId={user?.id}
              onClose={() => setUIState((prev) => ({ ...prev, showHistory: false }))}
              onSelectHistory={handleSelectHistory}
              localSearches={recentSearches}
              isOpen={uiState.showHistory}
            />
          </Suspense>
        )}

        {(searchState.hasSearched || user) && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 transition-all duration-300 ${uiState.isSidebarCollapsed ? "md:left-16" : "md:left-64"}`}
          >
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-4 space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <SearchInput
                    ref={searchInputRef}
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
                    onContentTypeChange={(type) => dispatchSearch({ type: "SET_CONTENT_TYPE", contentType: type })}
                    onVoiceSearch={handleVoiceSearch}
                    hasHistory={recentSearches.length > 0}
                  />
                </div>
              </div>
              {searchState.contentType === "image" && searchState.imageRateLimit && (
                <div className="text-center text-sm md:text-xs text-muted-foreground font-medium">
                  {searchState.imageRateLimit.remaining} of {searchState.imageRateLimit.limit} images remaining today
                </div>
              )}
              {searchState.contentType === "search" && searchState.rateLimitInfo && (
                <div className="text-center text-sm md:text-xs text-muted-foreground font-medium">
                  {searchState.rateLimitInfo.remaining} of {searchState.rateLimitInfo.limit} queries remaining today
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
