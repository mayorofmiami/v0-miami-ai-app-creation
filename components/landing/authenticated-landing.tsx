"use client"

import { useState, useRef, useEffect, useCallback, useReducer, Suspense, useMemo } from "react"
import { HistorySidebar } from "@/components/history-sidebar"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { toast } from "@/lib/toast"
import type { SearchInputRef } from "@/components/search-input"
import type { Attachment } from "@/types"
import type { BoardType } from "@/types"
import { PageHeader } from "@/components/page-header"
import { ExampleQueries } from "@/components/example-queries"
import { handleSearchError } from "@/lib/error-handling"
import { handleImageError } from "@/lib/error-handling"
import { storage, STORAGE_KEYS, threadStorage } from "@/lib/local-storage"
import { ConversationView } from "@/components/search-page/conversation-view"
import { SearchFormContainer } from "@/components/search-page/search-form-container"
import { BookmarksSidebar } from "@/components/bookmarks-sidebar"
import XIcon from "@/components/icons/X"
import { searchReducer } from "@/lib/reducers/search-reducer"
import { CouncilSelectorDialog } from "@/components/council/council-selector-dialog"
import type { ModelId } from "@/types"

const initialSearchState = {
  mode: "quick",
  contentType: "search",
  isLoading: false,
  messages: [],
  hasSearched: false,
  rateLimitInfo: null,
  imageRateLimit: null,
  boardroomMode: false,
  boardType: "startup",
  selectedModel: "auto",
  abortController: null,
}

export function AuthenticatedLanding({
  user,
  initialHistory = [],
  initialModelPreference = null,
  initialBookmarks = [],
}: {
  user: any
  initialHistory?: any[]
  initialModelPreference?: string | null
  initialBookmarks?: any[]
}) {
  const [searchState, dispatchSearch] = useReducer(searchReducer, initialSearchState)

  const searchStateRef = useRef(searchState)

  useEffect(() => {
    searchStateRef.current = searchState
  }, [searchState])

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

  const searchInputRef = useRef<SearchInputRef>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [recentSearches, setRecentSearches] = useState<string[]>([])
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
      toast.error("Failed to load conversation")
    }
  }, [])

  const handleModelChange = useCallback((model: ModelId) => {
    dispatchSearch({ type: "SET_SELECTED_MODEL", selectedModel: model })
    // Model change alone doesn't trigger search - user must click search/regenerate
  }, [])

  const handleCancelSearch = () => {
    if (searchState.abortController) {
      searchState.abortController.abort()
      dispatchSearch({ type: "SEARCH_ERROR", error: "" })
      dispatchSearch({ type: "SEARCH_COMPLETE" })
    }
  }

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleClearSearch = useCallback(() => {
    dispatchSearch({ type: "CLEAR_SEARCH" })
  }, [])

  const handleSearch = useCallback(
    async (query: string, searchMode: "quick" | "deep", attachments: Attachment[] = []) => {
      console.log("[v0] handleSearch called", { query, searchMode, attachments })

      // Get current state values at call time, not at definition time
      const currentState = searchStateRef.current
      console.log("[v0] Current state", {
        isLoading: currentState.isLoading,
        messagesLength: currentState.messages.length,
        hasSearched: currentState.hasSearched,
      })

      if (!query.trim() || currentState.isLoading) {
        console.log("[v0] Search blocked", { emptyQuery: !query.trim(), isLoading: currentState.isLoading })
        return
      }

      console.log("[v0] Dispatching START_SEARCH")
      dispatchSearch({ type: "START_SEARCH", query, mode: searchMode })

      try {
        const body: any = { query, mode: searchMode, userId: user.id }

        if (currentThreadId) {
          body.threadId = currentThreadId
        }

        if (currentState.selectedModel !== "auto") {
          body.selectedModel = currentState.selectedModel
        }

        if (attachments.length > 0) {
          body.attachments = attachments
        }

        if (currentState.messages.length > 0 && currentThreadId) {
          body.conversationHistory = currentState.messages
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
          signal: currentState.abortController?.signal,
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

        console.log("[v0] Fetch complete, starting to read stream")
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        let accumulatedResponse = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log("[v0] Stream complete")
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                console.log("[v0] Parsed chunk", { type: parsed.type, contentLength: parsed.content?.length })

                if (parsed.type === "text") {
                  accumulatedResponse += parsed.content
                  console.log("[v0] Dispatching UPDATE_CURRENT_RESPONSE", { totalLength: accumulatedResponse.length })
                  dispatchSearch({ type: "UPDATE_CURRENT_RESPONSE", response: accumulatedResponse })
                } else if (parsed.type === "citations") {
                  console.log("[v0] Dispatching SET_CURRENT_CITATIONS")
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
                } else if (parsed.type === "error") {
                  dispatchSearch({ type: "SEARCH_ERROR", error: parsed.content })
                  return
                }
              } catch (e) {
                // Silent parse failure handling
              }
            }
          }
        }

        console.log("[v0] Dispatching SEARCH_COMPLETE")
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
      }
    },
    [user, currentThreadId], // Use user instead of user.id
  )

  const handleImageGeneration = useCallback(
    async (prompt: string) => {
      if (searchState.isLoading) return

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
                      model: p.model || "Unknown",
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
                // Silent error handling for parse failures
              }
            }
          }
        }

        dispatchSearch({ type: "SEARCH_COMPLETE" })
        searchInputRef.current?.clear()
      } catch (error: any) {
        toast.error("Boardroom failed", error.message || "Please try again")
        dispatchSearch({ type: "SEARCH_ERROR", error: "Sorry, boardroom mode failed. Please try again." })
      }
    },
    [user, searchState.isLoading, currentThreadId],
  )

  const handleSearchOrGenerate = useCallback(
    async (query: string, mode: "quick" | "deep") => {
      // Default to search - image generation would be handled separately
      await handleSearch(query, mode, [])
    },
    [handleSearch],
  )

  const handleLogout = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        storage.removeItem("miami_user_cache")
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
    const currentState = searchStateRef.current
    const lastMessage =
      currentState.messages.length > 0 ? currentState.messages[currentState.messages.length - 1] : null
    if (lastMessage && lastMessage.type === "search") {
      handleSearch(lastMessage.query, currentState.mode, lastMessage.attachments)
    }
  }, [handleSearch])

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

  const handleSelectCouncil = useCallback((councilId: string | "quick") => {
    setSelectedCouncilId(councilId)
    setCouncilMode(true)
    setShowCouncilSelector(false)

    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }, [])

  const getLastMessage = useCallback(() => {
    return searchState.messages.length > 0 ? searchState.messages[searchState.messages.length - 1] : null
  }, [searchState.messages])

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
          <div
            className={`rounded-lg p-4 shadow-lg border ${
              searchState.rateLimitInfo.remaining === 0
                ? "bg-red-500/10 border-red-500/50"
                : "bg-yellow-500/10 border-yellow-500/50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {searchState.rateLimitInfo.remaining === 0
                    ? "⚠️ Rate Limit Reached"
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
          theme={user.theme || "dark"}
          setTheme={(theme) => user.setTheme(theme)}
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
              initialBookmarks={bookmarks}
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
          selectedModel={searchState.selectedModel}
          onModelChange={handleModelChange}
          onHistoryClick={handleToggleHistory}
          contentType={searchState.contentType}
          onContentTypeChange={(contentType) => dispatchSearch({ type: "SET_CONTENT_TYPE", contentType })}
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
