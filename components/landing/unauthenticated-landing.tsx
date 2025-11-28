"use client"

import { useState, useRef, useCallback, useReducer, useEffect } from "react"
import { SearchInput } from "@/components/search-input"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import type { ModelId } from "@/components/model-selector"
import { toast } from "@/lib/toast"
import type { SearchInputRef } from "@/components/search-input"
import type { Attachment } from "@/types"
import type { SearchMode, ContentType } from "@/types"
import { ConversationView } from "@/components/search-page/conversation-view"
import { SearchFormContainer } from "@/components/search-page/search-form-container"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { FancyGlowingButton } from "@/components/fancy-glowing-button"
import { SignupBenefitsCard } from "@/components/signup-benefits-card"
import { PageHeader } from "@/components/page-header"
import { searchReducer } from "@/lib/reducers/search-reducer"

const NON_AUTH_DEFAULT_MODEL: ModelId = "openai/gpt-4o-mini"

export function UnauthenticatedLanding() {
  console.log("[v0] UnauthenticatedLanding component rendering")
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [connectionType, setConnectionType] = useState<"fast" | "medium" | "slow">("medium")
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

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  const [selectedModel, setSelectedModel] = useState<ModelId>(NON_AUTH_DEFAULT_MODEL)

  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<SearchInputRef>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [recentSearches, setRecentSearches] = useState<string[]>([])

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
    setCurrentThreadId(null)
  }

  const handleSearch = useCallback(
    async (query: string, searchMode: SearchMode, attachments?: Attachment[]) => {
      if (searchState.isLoading) {
        return
      }

      dispatchSearch({ type: "START_SEARCH", query, mode: searchMode })

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            mode: searchMode,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error("Search failed")
        }

        const data = await response.json()

        dispatchSearch({
          type: "UPDATE_CURRENT_RESPONSE",
          response: data.response,
        })

        if (data.sources) {
          dispatchSearch({
            type: "SET_CURRENT_CITATIONS",
            citations: data.sources,
          })
        }

        dispatchSearch({ type: "SEARCH_COMPLETE" })
        searchInputRef.current?.clear()
        setRecentSearches((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 10))
      } catch (error: any) {
        if (error.name === "AbortError") {
          return
        }
        console.error("[Search Error]:", error)
        toast.error("Search failed. Please try again.")
        dispatchSearch({ type: "SEARCH_ERROR", error: "Search failed" })
      } finally {
        abortControllerRef.current = null
      }
    },
    [searchState.isLoading],
  )

  const handleImageGeneration = useCallback(
    async (prompt: string) => {
      if (searchState.isLoading) {
        return
      }

      dispatchSearch({ type: "START_IMAGE_GENERATION", prompt })

      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
          }),
        })

        if (!response.ok) {
          throw new Error("Image generation failed")
        }

        const data = await response.json()

        dispatchSearch({
          type: "SET_GENERATED_IMAGE",
          image: data.imageUrl,
          rateLimit: { remaining: 49, total: 50, resetAt: Date.now() + 24 * 60 * 60 * 1000 },
        })

        searchInputRef.current?.clear()
        toast.success("Image generated successfully!")
      } catch (error) {
        console.error("[Image Generation Error]:", error)
        toast.error("Image generation failed. Please try again.")
        dispatchSearch({ type: "SEARCH_ERROR", error: "Image generation failed" })
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const detectConnection = () => {
      if ("connection" in navigator) {
        const conn = (navigator as any).connection
        const effectiveType = conn?.effectiveType || "unknown"
        const saveData = conn?.saveData || false

        if (saveData) {
          setConnectionType("slow")
          setShouldLoadVideo(false)
          return
        }

        if (effectiveType === "4g" || effectiveType === "wifi") {
          setConnectionType("fast")
          setShouldLoadVideo(true)
        } else if (effectiveType === "3g") {
          setConnectionType("medium")
          setTimeout(() => setShouldLoadVideo(true), 2000)
        } else {
          setConnectionType("slow")
          setShouldLoadVideo(false)
        }
      } else {
        setConnectionType("medium")
        setTimeout(() => setShouldLoadVideo(true), 2000)
      }
    }

    detectConnection()

    if ("connection" in navigator) {
      const conn = (navigator as any).connection
      conn?.addEventListener("change", detectConnection)
      return () => {
        conn?.removeEventListener("change", detectConnection)
        window.removeEventListener("resize", checkMobile)
      }
    }

    return () => window.removeEventListener("resize", checkMobile)
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
        {searchState.hasSearched && (
          <div className="fixed inset-x-0 top-0 h-26 md:h-32 bg-gradient-to-b from-background via-background to-transparent pointer-events-none z-40" />
        )}

        <PageHeader
          hasSearched={searchState.hasSearched}
          isAuthenticated={false}
          isSidebarCollapsed={true}
          isDrawerOpen={false}
          onOpenChange={() => {}}
          isAdmin={false}
          recentSearches={[]}
          user={null}
          isLoadingUser={false}
          theme="dark"
          setTheme={() => {}}
          handleNewChat={handleClearSearch}
          handleToggleHistory={() => {}}
          handleToggleBookmarks={() => {}}
          handleSearch={() => {}}
          searchMode={searchState.mode}
        />

        <main
          className={`flex-1 ${searchState.hasSearched ? "container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 pb-36 md:pb-32 pt-20 md:pt-24" : ""}`}
        >
          {!searchState.hasSearched ? (
            <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
              <div
                className="absolute inset-0 w-full h-full object-cover -z-10 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${isMobile ? "/videos/miami-mobile-poster.jpg" : "/videos/miami-desktop-poster.jpg"})`,
                  opacity: videoLoaded ? 0 : 1,
                  transition: "opacity 1s ease-in-out",
                }}
              />

              {shouldLoadVideo && (
                <video
                  key={isMobile ? "mobile" : "desktop"}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={() => setVideoLoaded(true)}
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                  style={{
                    opacity: videoLoaded ? 1 : 0,
                    transition: "opacity 1s ease-in-out",
                  }}
                >
                  {isMobile ? (
                    <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/night-miami-traffic-mobile.mp4-2-CWh1oOGYX82ztWbL9gvoFINdR9BTpn.mp4" type="video/mp4" />
                  ) : (
                    <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/night-miami-traffic-desktop.mp4-HELLerchqRDbqyiaIMCAzMl4GYVaAX.mp4" type="video/mp4" />
                  )}
                </video>
              )}

              {!videoLoaded && connectionType === "slow" && (
                <div className="absolute inset-0 bg-gradient-to-br from-miami-blue/30 via-miami-purple/20 to-miami-aqua/30 -z-20" />
              )}

              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black/40 -z-20" />

              <div className="absolute top-12 z-10">
                <Logo className="w-48" />
              </div>

              <div className="absolute top-32 z-10 text-center">
                <p className="text-2xl md:text-3xl italic font-serif text-white/95 drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">
                  Coming when Spencer feels like it
                </p>
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
                <Link href="/login">
                  <FancyGlowingButton>LOGIN</FancyGlowingButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="dark">
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
            </div>
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

      {/* <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style> */}
    </>
  )
}

console.log("[v0] UnauthenticatedLanding module loading")
