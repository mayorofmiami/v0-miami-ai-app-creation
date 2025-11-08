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
import { throttle } from "@/lib/throttle"
import { storage, STORAGE_KEYS, threadStorage } from "@/lib/local-storage"
import { logger } from "@/lib/logger"
import { ConversationView } from "@/components/search-page/conversation-view"
import { SearchFormContainer } from "@/components/search-page/search-form-container"

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

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return threadStorage.getCurrentThreadId()
    }
    return null
  })

  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [selectedModel, setSelectedModel] = useState<ModelId>("auto")
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<SearchInputRef>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const handleToggleMode = useCallback(() => {
    // Placeholder for handleToggleMode logic
    dispatchSearch({ type: "SET_MODE", mode: searchState.mode === "quick" ? "deep" : "quick" })
  }, [searchState.mode])

  const handleToggleHistory = useCallback(() => {
    setUIState((prev) => ({ ...prev, showHistory: !prev.showHistory }))
  }, [])

  useEffect(() => {
    storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, recentSearches)
  }, [recentSearches])

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
        await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            modelPreference: newModel === "auto" ? "auto" : "manual",
            selectedModel: newModel === "auto" ? null : newModel,
          }),
        })
      } catch (error) {
        logger.error("Failed to update model preference", { error })
        toast.error("Failed to save preference", "Your model preference couldn't be saved. It will reset on refresh.")
      }
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
          title: query.slice(0, 50), // Temporary title
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
          body.conversationHistory = searchState.messages
            .map((msg) => ({
              role: msg.type === "search" ? "user" : "assistant",
              content: msg.type === "search" ? msg.query : msg.response || "",
            }))
            .filter((msg) => msg.content.trim().length > 0)
        }

        console.log(
          "[v0] Sending search request with threadId:",
          user?.id ? currentThreadId || "none" : "client-side only",
        )

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        })

        if (res.status === 429 || !res.ok) {
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
        console.log("[v0] Received threadId from server:", threadId || "none")

        if (!user?.id && effectiveThreadId) {
          const thread = threadStorage.getThread(effectiveThreadId)
          if (thread) {
            threadStorage.updateThread(effectiveThreadId, {
              queries: [...thread.queries, query],
              lastMessageAt: Date.now(),
              messageCount: thread.messageCount + 1,
            })
          }

          // Generate AI title after first query
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

        // After streaming completes, reset mode back to quick
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

    setCurrentThreadId(null)
    if (!user?.id) {
      threadStorage.clearCurrentThread()
    }

    setUIState((prev) => ({ ...prev, isDrawerOpen: false }))
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
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
    const handleScroll = throttle(() => {
      // Placeholder for handleScroll logic
    }, 100)

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    const messages = searchState.messages
    const currentMessageCount = messages.length

    // Clean up refs for messages that no longer exist
    const currentMessageIds = new Set(messages.map((m) => m.id))
    Object.keys(messageRefs.current).forEach((id) => {
      if (!currentMessageIds.has(id)) {
        delete messageRefs.current[id]
      }
    })

    if (currentMessageCount > 0) {
      const latestMessage = messages[currentMessageCount - 1]
      const messageElement = messageRefs.current[latestMessage.id]

      // Only auto-scroll if user hasn't manually scrolled
      if (messageElement) {
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
          onOpenChange={(open) => setUIState((prev) => ({ ...prev, isDrawerOpen: open }))}
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

        <main
          id="main-content"
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
                        sizes="(max-width: 768px) 288px, 384px"
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
                          onContentTypeChange={handleContentTypeChange}
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
                <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              )}
            </>
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
              userId={user?.id}
              onClose={() => setUIState((prev) => ({ ...prev, showHistory: false }))}
              onSelectHistory={handleSelectHistory}
              localSearches={recentSearches}
              isOpen={uiState.showHistory}
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
        />
      </div>
    </ErrorBoundary>
  )
}
