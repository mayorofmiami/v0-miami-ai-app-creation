"use client"

import { useState, useRef, useCallback, useReducer, useEffect } from "react"
import { SearchInput } from "@/components/search-input"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import type { ModelId } from "@/components/model-selector"
import type { SearchHistory } from "@/lib/db"
import { toast } from "@/lib/toast"
import type { SearchInputRef } from "@/components/search-input"
import type { Attachment } from "@/types"
import type { SearchState, SearchAction, SearchMode, ContentType } from "@/types"
import { handleSearchError } from "@/lib/error-handling"
import { handleImageError } from "@/lib/error-handling"
import { storage, STORAGE_KEYS, threadStorage } from "@/lib/local-storage"
import { logger } from "@/lib/logger"
import { ConversationView } from "@/components/search-page/conversation-view"
import { SearchFormContainer } from "@/components/search-page/search-form-container"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { FancyGlowingButton } from "@/components/fancy-glowing-button"
import { SignupBenefitsCard } from "@/components/signup-benefits-card"

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

export function UnauthenticatedLanding() {
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

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return threadStorage.getCurrentThreadId()
    }
    return null
  })

  const [selectedModel, setSelectedModel] = useState<ModelId>(NON_AUTH_DEFAULT_MODEL)

  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<SearchInputRef>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, recentSearches)
  }, [recentSearches])

  const handleToggleMode = useCallback(() => {
    dispatchSearch({ type: "SET_MODE", mode: searchState.mode === "quick" ? "deep" : "quick" })
  }, [searchState.mode])

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

      let effectiveThreadId = currentThreadId
      if (!effectiveThreadId) {
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

        if (selectedModel !== "auto") {
          body.selectedModel = selectedModel
        }

        if (attachments && attachments.length > 0) {
          body.attachments = attachments
        }

        if (searchState.messages.length > 0 && currentThreadId) {
          body.conversationHistory = searchState.messages
            .slice(-5)
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
            user: null,
            status: res.status,
          })
          dispatchSearch({ type: "SEARCH_ERROR", error: errorMessage })
          return
        }

        if (!res.ok) {
          const errorData = await res.json()
          const errorMessage = handleSearchError({
            error: errorData,
            user: null,
            status: res.status,
          })
          dispatchSearch({ type: "SEARCH_ERROR", error: errorMessage })
          return
        }

        if (effectiveThreadId) {
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
    [selectedModel, searchState.isLoading, currentThreadId, searchState.messages],
  )

  const handleImageGeneration = useCallback(
    async (prompt: string) => {
      if (searchState.isLoading) {
        return
      }

      dispatchSearch({ type: "START_IMAGE_GENERATION", prompt })

      try {
        const body: any = { prompt }

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
    [searchState.isLoading],
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

  const handleModelChange = async (newModel: ModelId) => {
    setSelectedModel(newModel)
    if (typeof window !== "undefined") {
      storage.setItem(STORAGE_KEYS.MODEL_PREFERENCE, newModel)
    }
  }

  const lastMessage = searchState.messages.length > 0 ? searchState.messages[searchState.messages.length - 1] : null

  const handleRegenerate = useCallback(() => {
    if (lastMessage) {
      handleSearch(lastMessage.query, searchState.mode)
    }
  }, [lastMessage, handleSearch, searchState.mode])

  const handleContentTypeChange = useCallback((type: ContentType) => {
    dispatchSearch({ type: "SET_CONTENT_TYPE", contentType: type })
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    const detectConnection = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection
        const effectiveType = conn?.effectiveType || 'unknown'
        const saveData = conn?.saveData || false

        if (saveData) {
          setConnectionType('slow')
          setShouldLoadVideo(false)
          return
        }

        if (effectiveType === '4g' || effectiveType === 'wifi') {
          setConnectionType('fast')
          setShouldLoadVideo(true)
        } else if (effectiveType === '3g') {
          setConnectionType('medium')
          setTimeout(() => setShouldLoadVideo(true), 2000)
        } else {
          setConnectionType('slow')
          setShouldLoadVideo(false)
        }
      } else {
        setConnectionType('medium')
        setTimeout(() => setShouldLoadVideo(true), 2000)
      }
    }

    detectConnection()

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
    <>
      <KeyboardShortcuts
        onSearch={handleFocusSearch}
        onClear={handleClearSearch}
        onToggleMode={handleToggleMode}
        onToggleHistory={() => {}}
        onNewChat={handleClearSearch}
        onToggleBookmarks={() => {}}
      />

      <div className="min-h-screen flex flex-col">
        <main className={`flex-1 ${searchState.hasSearched ? "container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 pb-36 md:pb-32 pt-20 md:pt-24" : ""}`}>
          {!searchState.hasSearched ? (
            <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
              <div 
                className="absolute inset-0 w-full h-full object-cover -z-10 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${isMobile ? '/videos/miami-mobile-poster.jpg' : '/videos/miami-desktop-poster.jpg'})`,
                  opacity: videoLoaded ? 0 : 1,
                  transition: 'opacity 1s ease-in-out'
                }}
              />

              {shouldLoadVideo && (
                <video
                  key={isMobile ? 'mobile' : 'desktop'}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={() => setVideoLoaded(true)}
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                  style={{
                    opacity: videoLoaded ? 1 : 0,
                    transition: 'opacity 1s ease-in-out'
                  }}
                >
                  {isMobile ? (
                    <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/night-miami-traffic-mobile.mp4-2-CWh1oOGYX82ztWbL9gvoFINdR9BTpn.mp4" type="video/mp4" />
                  ) : (
                    <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/night-miami-traffic-desktop.mp4-HELLerchqRDbqyiaIMCAzMl4GYVaAX.mp4" type="video/mp4" />
                  )}
                </video>
              )}

              {!videoLoaded && connectionType === 'slow' && (
                <div className="absolute inset-0 bg-gradient-to-br from-miami-blue/30 via-miami-purple/20 to-miami-aqua/30 -z-20" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black/40 -z-20" />

              <div className="absolute top-12 z-10">
                <Logo className="w-48" />
              </div>

              <div className="w-full max-w-2xl z-10">
                <SearchInput
                  ref={searchInputRef}
                  onSearch={handleSearchOrGenerate}
                  isLoading={searchState.isLoading}
                  mode={searchState.mode}
                  onModeChange={(mode) => dispatchSearch({ type: "SET_MODE", mode })}
                  onCancel={handleCancelSearch}
                  recentSearches={recentSearches}
                  user={null}
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  onHistoryClick={() => {}}
                  contentType={searchState.contentType}
                  onContentTypeChange={handleContentTypeChange}
                />
              </div>

              <div className="absolute bottom-12 z-10 flex flex-col items-center gap-4">
                <button
                  onClick={() => (window.location.href = "/api/auth/google")}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
                
                <div className="text-sm text-muted-foreground">or</div>
                
                <Link href="/login">
                  <FancyGlowingButton>
                    LOGIN / SIGN UP
                  </FancyGlowingButton>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ConversationView
                messages={searchState.messages}
                messageRefs={messageRefs}
                user={null}
                searchMode={searchState.mode}
                onRegenerate={handleRegenerate}
                onRelatedSearchClick={(search) => handleSearch(search, searchState.mode)}
                onImageRegenerate={handleImageGeneration}
              />

              {lastMessage && !lastMessage.isStreaming && (
                <div className="mt-12 mb-24 flex flex-col items-center">
                  <SignupBenefitsCard />
                </div>
              )}
            </>
          )}
        </main>

        {searchState.hasSearched && (
          <SearchFormContainer
            searchInputRef={searchInputRef}
            onSearch={handleSearchOrGenerate}
            isLoading={searchState.isLoading}
            mode={searchState.mode}
            onModeChange={(mode) => dispatchSearch({ type: "SET_MODE", mode })}
            onCancel={handleCancelSearch}
            recentSearches={recentSearches}
            user={null}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            onHistoryClick={() => {}}
            contentType={searchState.contentType}
            onContentTypeChange={handleContentTypeChange}
            rateLimitInfo={searchState.rateLimitInfo}
            imageRateLimit={searchState.imageRateLimit}
            isSidebarCollapsed={true}
            hasSearched={searchState.hasSearched}
          />
        )}
      </div>
    </>
  )
}
