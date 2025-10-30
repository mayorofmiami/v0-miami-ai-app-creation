"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { SearchInput } from "@/components/search-input"
import { SearchResponse } from "@/components/search-response"
import { SearchActions } from "@/components/search-actions"
import { HistorySidebar } from "@/components/history-sidebar"
import { RelatedSearches } from "@/components/related-searches"
import { EmptyState } from "@/components/empty-state"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { ThemeToggle } from "@/components/theme-toggle"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import type { ModelId } from "@/components/model-selector"
import { ModelBadge } from "@/components/model-badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { User, Menu, Plus, Clock, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { SearchHistory } from "@/lib/db"
import { toast } from "@/lib/toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { SkeletonSearch } from "@/components/skeleton-search"
import { generateRelatedSearches } from "@/lib/search-suggestions"
import { HelpMenu } from "@/components/help-menu"
import { FeatureActions } from "@/components/feature-actions"

export default function Home() {
  const [mode, setMode] = useState<"quick" | "deep">("quick")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState("")
  const [citations, setCitations] = useState<Array<{ title: string; url: string; snippet: string }>>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentQuery, setCurrentQuery] = useState("")
  const [currentSearchId, setCurrentSearchId] = useState<string | undefined>()
  const [relatedSearches, setRelatedSearches] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role?: string } | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [shouldFocusInput, setShouldFocusInput] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [selectedModel, setSelectedModel] = useState<ModelId>("auto")
  const [currentModelInfo, setCurrentModelInfo] = useState<{
    model: string
    reason: string
    autoSelected: boolean
  } | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const userId = user?.id || null
  const isAdmin = user?.role === "owner" || user?.role === "admin"

  useEffect(() => {
    async function loadRecentSearches() {
      console.log("[v0] loadRecentSearches - userId:", userId)
      if (!userId) {
        console.log("[v0] No userId, skipping database fetch")
        return
      }
      try {
        const res = await fetch(`/api/history?userId=${userId}`)
        const data = await res.json()
        console.log("[v0] Fetched recent searches:", data)
        const recent = (data.history || []).slice(0, 10).map((h: SearchHistory) => h.query)
        setRecentSearches(recent)
      } catch (error) {
        console.error("[v0] Failed to load recent searches:", error)
      }
    }
    loadRecentSearches()
  }, [userId])

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/user")
        const data = await res.json()
        setUser(data.user)
      } catch (error) {
        console.error("[v0] Failed to load user:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    async function loadModelPreference() {
      if (!userId) return

      try {
        const res = await fetch(`/api/model-preference?userId=${userId}`)
        const data = await res.json()

        if (data.preference) {
          if (data.preference.model_preference === "manual" && data.preference.selected_model) {
            setSelectedModel(data.preference.selected_model as ModelId)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load model preference:", error)
      }
    }
    loadModelPreference()
  }, [userId])

  useEffect(() => {
    if (window.location.hash === "#history") {
      setShowHistory(true)
      // Clear the hash after opening
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (shouldFocusInput && !hasSearched) {
      // Wait for next frame to ensure component is mounted
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
        setShouldFocusInput(false)
      })
    }
  }, [shouldFocusInput, hasSearched])

  const handleModelChange = async (newModel: ModelId) => {
    setSelectedModel(newModel)

    if (userId) {
      try {
        await fetch("/api/model-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            modelPreference: newModel === "auto" ? "auto" : "manual",
            selectedModel: newModel === "auto" ? null : newModel,
          }),
        })
      } catch (error) {
        console.error("[v0] Failed to save model preference:", error)
      }
    }
  }

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      toast.info("Search canceled")
    }
  }

  const handleFocusSearch = () => {
    searchInputRef.current?.focus()
  }

  const handleClearSearch = () => {
    setHasSearched(false)
    setResponse("")
    setCitations([])
    setCurrentQuery("")
    setRelatedSearches([])
    setCurrentModelInfo(null) // Clear model info
  }

  const handleToggleMode = () => {
    setMode((prev) => {
      const newMode = prev === "quick" ? "deep" : "quick"
      toast.info(`Switched to ${newMode === "quick" ? "Quick Search" : "Deep Research"} mode`)
      return newMode
    })
  }

  const handleToggleHistory = () => {
    setIsDrawerOpen(false)
    setShowHistory((prev) => !prev)
  }

  const handleSearch = useCallback(
    async (query: string, searchMode: "quick" | "deep") => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      setIsLoading(true)
      setHasSearched(true)
      setResponse("")
      setCitations([])
      setCurrentQuery(query)
      setCurrentSearchId(undefined)
      setCurrentModelInfo(null)
      setRelatedSearches(generateRelatedSearches(query))

      const loadingToast = toast.loading(searchMode === "deep" ? "Deep research in progress..." : "Searching...")

      try {
        const body: any = { query, mode: searchMode }
        if (userId) {
          body.userId = userId
          console.log("[v0] Searching with userId:", userId)
        } else {
          console.log("[v0] Searching without userId (not authenticated)")
        }

        if (selectedModel !== "auto") {
          body.selectedModel = selectedModel
        }

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        })

        if (res.status === 429) {
          const error = await res.json()
          toast.dismiss(loadingToast)

          if (error.type === "ai_gateway_rate_limit" || error.type === "ai_gateway_error") {
            toast.error(
              "AI Service Temporarily Limited",
              "Free AI credits have rate limits due to abuse. Please try again in a few minutes, or contact support to purchase AI credits.",
              10000,
            )
            setResponse(
              `⚠️ **AI Service Temporarily Limited**\n\nVercel's free AI credits currently have rate limits in place due to abuse. This is a temporary measure while they work on a resolution.\n\n**What you can do:**\n- Wait a few minutes and try again\n- Try a different AI model from the settings menu\n- Contact support to purchase AI credits for unrestricted access\n\nWe apologize for the inconvenience!`,
            )
          } else {
            toast.error(
              "Rate Limit Exceeded",
              error.reason ||
                `You've reached your query limit. ${userId ? "Limit: 100 queries per 24 hours" : "Sign in for more queries (100/day) or wait for your limit to reset."}`,
            )
            setResponse(
              `⚠️ Rate limit exceeded. ${userId ? "You've used all 100 queries for today." : "Sign in for 100 queries per day, or wait for your limit to reset (10 queries per 24 hours for unsigned users)."}`,
            )
          }
          setIsLoading(false)
          return
        }

        if (!res.ok) {
          const error = await res.json()
          const errorMessage = error.error || "Search failed"

          if (res.status === 503 && errorMessage.includes("API key")) {
            toast.dismiss(loadingToast)
            toast.error("Configuration Error", "Please add EXA_API_KEY to environment variables in the Vars section")
            setResponse("⚠️ Search is not configured. Please add your EXA_API_KEY to the environment variables.")
            return
          }

          throw new Error(errorMessage)
        }

        const remaining = res.headers.get("X-RateLimit-Remaining")
        const limit = res.headers.get("X-RateLimit-Limit")
        if (remaining && limit) {
          setRateLimitInfo({ remaining: Number.parseInt(remaining), limit: Number.parseInt(limit) })
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error("No response body")

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
                  setResponse(accumulatedResponse)
                } else if (parsed.type === "citations") {
                  setCitations(parsed.content || parsed.citations || [])
                } else if (parsed.type === "model") {
                  setCurrentModelInfo({
                    model: parsed.content?.model || parsed.model,
                    reason: parsed.content?.reason || parsed.reason,
                    autoSelected: parsed.content?.autoSelected ?? parsed.autoSelected ?? true,
                  })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        toast.dismiss(loadingToast)
        toast.success("Search complete!")

        setRecentSearches((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 10))
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("[v0] Search aborted by user")
          return
        }

        console.error("[v0] Search error:", error)
        toast.dismiss(loadingToast)
        toast.error("Search failed", error.message || "Please try again")
        setResponse("Sorry, something went wrong. Please try again.")
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [userId, selectedModel],
  ) // Add dependencies for useCallback

  const handleSelectHistory = (history: SearchHistory) => {
    if (!history.response || history.response.trim() === "") {
      // If no response (local/unauthenticated history), re-run the search
      console.log("[v0] No response in history, re-running search for:", history.query)
      handleSearch(history.query, history.mode)
      return
    }

    // Load from history if response exists
    setHasSearched(true)
    setMode(history.mode)
    setResponse(history.response)
    setCitations(history.citations || [])
    setCurrentQuery(history.query)
    setCurrentSearchId(history.id)
    setRelatedSearches(generateRelatedSearches(history.query))
    if (history.model_used) {
      setCurrentModelInfo({
        model: history.model_used,
        reason: history.selection_reason || "",
        autoSelected: history.auto_selected ?? true,
      })
    }
    toast.info("Loaded from history")
  }

  const handleLogout = async () => {
    try {
      const formData = new FormData()
      await fetch("/api/auth/logout", { method: "POST", body: formData })
      setUser(null)
      toast.success("Logged out successfully")
      setIsDrawerOpen(false)
    } catch (error) {
      console.error("[v0] Logout error:", error)
      toast.error("Failed to log out")
    }
  }

  const handleNewChat = () => {
    handleClearSearch()
    setIsDrawerOpen(false)

    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 400)
  }

  const handleFeatureAction = (query: string, actionMode: "quick" | "deep") => {
    if (actionMode === "deep" && !query) {
      // Just switch to deep mode and focus input
      setMode("deep")
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else if (query) {
      // Focus input with pre-filled query
      setMode(actionMode)
      setTimeout(() => {
        searchInputRef.current?.focus()
        // Optionally pre-fill the query
        // This would require adding a prop to SearchInput to set initial value
      }, 100)
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
        onSearchSelect={(search) => handleSearch(search, mode)}
        onToggleHistory={handleToggleHistory}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"}`}
      >
        {hasSearched && (
          <div
            className={`fixed top-6 left-0 right-0 z-50 px-6 transition-all duration-300 ${isSidebarCollapsed ? "md:left-16" : "md:left-64"}`}
          >
            <div className="flex items-center justify-between max-w-full">
              {/* Menu Button - Mobile only */}
              <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden group relative h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 border-miami-aqua/20 hover:border-miami-aqua hover:bg-miami-aqua/5 transition-all duration-300 shadow-lg hover:shadow-miami-aqua/20"
                    aria-label="Open menu"
                  >
                    <Menu className="text-miami-aqua w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[340px] sm:w-80 flex flex-col">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <Image
                      src="/miami-ai-logo.png"
                      alt="MIAMI.AI"
                      width={180}
                      height={36}
                      className="h-9 w-auto"
                      priority
                    />
                  </div>

                  {/* Navigation - Top Section */}
                  <nav className="flex-1 flex flex-col gap-2" aria-label="Main navigation">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base text-muted-foreground hover:text-foreground h-12 px-4"
                      onClick={handleNewChat}
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      New Chat
                    </Button>

                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsDrawerOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-base text-miami-aqua hover:text-miami-aqua hover:bg-miami-aqua/10 h-12 px-4"
                        >
                          <Shield className="w-5 h-5 mr-3" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}

                    {recentSearches.length > 0 && (
                      <div className="pt-5 border-t border-border mt-2">
                        <div className="flex items-center justify-between px-4 mb-3">
                          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Recent Chats
                          </p>
                          <button
                            onClick={handleToggleHistory}
                            className="text-sm font-medium text-miami-aqua hover:text-miami-aqua/80 transition-colors"
                          >
                            See All
                          </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {recentSearches.slice(0, 5).map((search, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                handleSearch(search, mode)
                                setIsDrawerOpen(false)
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-base text-foreground group-hover:text-miami-aqua transition-colors line-clamp-1">
                                  {search}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-5 border-t border-border mt-2">
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-base text-muted-foreground">Theme</span>
                        <ThemeToggle />
                      </div>
                    </div>

                    <div className="border-t border-border pt-3 mt-2">
                      <HelpMenu isMobile />
                    </div>
                  </nav>

                  {/* Account Section - Bottom */}
                  <div className="border-t pt-6 pb-8 mt-auto">
                    {isLoadingUser ? (
                      <div className="flex items-center gap-3 px-4">
                        <div className="w-12 h-12 rounded-full bg-muted/50 animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted/50 rounded w-24 animate-pulse" />
                          <div className="h-3 bg-muted/50 rounded w-32 animate-pulse" />
                        </div>
                      </div>
                    ) : user ? (
                      <>
                        <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-miami-aqua/20 to-miami-pink/20 flex items-center justify-center flex-shrink-0 border border-miami-aqua/20">
                              <User className="w-6 h-6 text-miami-aqua" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold truncate group-hover:text-miami-aqua transition-colors">
                                {user.name || "User"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        </Link>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3 px-4">
                        <Link href="/login" onClick={() => setIsDrawerOpen(false)} className="block">
                          <Button className="w-full bg-miami-aqua hover:bg-miami-aqua/90 text-white font-medium h-12 rounded-lg shadow-sm hover:shadow-md transition-all text-base">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsDrawerOpen(false)} className="block">
                          <Button
                            variant="outline"
                            className="w-full h-12 rounded-lg border-2 border-border hover:border-miami-aqua hover:bg-miami-aqua/5 font-medium transition-all bg-transparent text-base"
                          >
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo - Centered */}
              <div className="absolute left-1/2 -translate-x-1/2">
                <Image
                  src="/miami-ai-logo.png"
                  alt="MIAMI.AI"
                  width={140}
                  height={28}
                  className="h-12 w-auto"
                  priority
                />
              </div>

              {/* Search Actions Button (3 dots) */}
              {response && (
                <div className="rounded-full bg-background/80 backdrop-blur-sm border border-border/40 hover:border-miami-aqua/40 transition-all duration-200">
                  <SearchActions
                    query={currentQuery}
                    response={response}
                    citations={citations}
                    mode={mode}
                    searchId={currentSearchId}
                    userId={userId}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menu Button - Home page only, mobile only */}
        {!hasSearched && !user && (
          <div className="fixed top-6 left-6 z-50 md:hidden">
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group relative h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 border-miami-aqua/20 hover:border-miami-aqua hover:bg-miami-aqua/5 transition-all duration-300 shadow-lg hover:shadow-miami-aqua/20"
                  aria-label="Open menu"
                >
                  <Menu className="text-miami-aqua w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[340px] sm:w-80 flex flex-col">
                <div className="flex flex-col items-center gap-4 py-4">
                  <Image
                    src="/miami-ai-logo.png"
                    alt="MIAMI.AI"
                    width={180}
                    height={36}
                    className="h-9 w-auto"
                    priority
                  />
                </div>

                <nav className="flex-1 flex flex-col gap-2" aria-label="Main navigation">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base text-muted-foreground hover:text-foreground h-12 px-4"
                    onClick={handleNewChat}
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    New Chat
                  </Button>

                  {isAdmin && (
                    <Link href="/admin" onClick={() => setIsDrawerOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base text-miami-aqua hover:text-miami-aqua hover:bg-miami-aqua/10 h-12 px-4"
                      >
                        <Shield className="w-5 h-5 mr-3" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}

                  {recentSearches.length > 0 && (
                    <div className="pt-5 border-t border-border mt-2">
                      <div className="flex items-center justify-between px-4 mb-3">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Recent Chats
                        </p>
                        <button
                          onClick={handleToggleHistory}
                          className="text-sm font-medium text-miami-aqua hover:text-miami-aqua/80 transition-colors"
                        >
                          See All
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recentSearches.slice(0, 5).map((search, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              handleSearch(search, mode)
                              setIsDrawerOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-base text-foreground group-hover:text-miami-aqua transition-colors line-clamp-1">
                                {search}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-5 border-t border-border mt-2">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-base text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mt-2">
                    <HelpMenu isMobile />
                  </div>
                </nav>

                <div className="border-t pt-6 pb-8 mt-auto">
                  {isLoadingUser ? (
                    <div className="flex items-center gap-3 px-4">
                      <div className="w-12 h-12 rounded-full bg-muted/50 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted/50 rounded w-24 animate-pulse" />
                        <div className="h-3 bg-muted/50 rounded w-32 animate-pulse" />
                      </div>
                    </div>
                  ) : user ? (
                    <>
                      <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-miami-aqua/20 to-miami-pink/20 flex items-center justify-center flex-shrink-0 border border-miami-aqua/20">
                            <User className="w-6 h-6 text-miami-aqua" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold truncate group-hover:text-miami-aqua transition-colors">
                              {user.name || "User"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <div className="flex flex-col gap-3 px-4">
                      <Link href="/login" onClick={() => setIsDrawerOpen(false)} className="block">
                        <Button className="w-full bg-miami-aqua hover:bg-miami-aqua/90 text-white font-medium h-12 rounded-lg shadow-sm hover:shadow-md transition-all text-base">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsDrawerOpen(false)} className="block">
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-lg border-2 border-border hover:border-miami-aqua hover:bg-miami-aqua/5 font-medium transition-all bg-transparent text-base"
                        >
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Hamburger Menu Button for Authenticated Users on Home Page */}
        {!hasSearched && user && (
          <div className="fixed top-6 left-6 z-50 md:hidden">
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group relative h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 border-miami-aqua/20 hover:border-miami-aqua hover:bg-miami-aqua/5 transition-all duration-300 shadow-lg hover:shadow-miami-aqua/20"
                  aria-label="Open menu"
                >
                  <Menu className="text-miami-aqua w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[340px] sm:w-80 flex flex-col">
                <div className="flex flex-col items-center gap-4 py-4">
                  <Image
                    src="/miami-ai-logo.png"
                    alt="MIAMI.AI"
                    width={180}
                    height={36}
                    className="h-9 w-auto"
                    priority
                  />
                </div>

                <nav className="flex-1 flex flex-col gap-2" aria-label="Main navigation">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base text-muted-foreground hover:text-foreground h-12 px-4"
                    onClick={handleNewChat}
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    New Chat
                  </Button>

                  {isAdmin && (
                    <Link href="/admin" onClick={() => setIsDrawerOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base text-miami-aqua hover:text-miami-aqua hover:bg-miami-aqua/10 h-12 px-4"
                      >
                        <Shield className="w-5 h-5 mr-3" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}

                  {recentSearches.length > 0 && (
                    <div className="pt-5 border-t border-border mt-2">
                      <div className="flex items-center justify-between px-4 mb-3">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Recent Chats
                        </p>
                        <button
                          onClick={handleToggleHistory}
                          className="text-sm font-medium text-miami-aqua hover:text-miami-aqua/80 transition-colors"
                        >
                          See All
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recentSearches.slice(0, 5).map((search, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              handleSearch(search, mode)
                              setIsDrawerOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-base text-foreground group-hover:text-miami-aqua transition-colors line-clamp-1">
                                {search}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-5 border-t border-border mt-2">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-base text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mt-2">
                    <HelpMenu isMobile />
                  </div>
                </nav>

                <div className="border-t pt-6 pb-8 mt-auto">
                  <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-miami-aqua/20 to-miami-pink/20 flex items-center justify-center flex-shrink-0 border border-miami-aqua/20">
                        <User className="w-6 h-6 text-miami-aqua" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate group-hover:text-miami-aqua transition-colors">
                          {user.name || "User"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {!hasSearched && user && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-center">
              <Image src="/miami-ai-logo.png" alt="MIAMI.AI" width={120} height={24} className="h-12 w-auto" priority />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 container mx-auto sm:px-6 lg:px-8 px-4 py-12 max-w-full overflow-x-hidden ${hasSearched ? "pb-32 pt-24" : user ? "pt-24" : ""}`}
        >
          {!hasSearched ? (
            <>
              {!user && (
                <div className="flex flex-col items-center min-h-[calc(100vh-6rem)] space-y-6 sm:space-y-8 animate-in fade-in duration-700 justify-center">
                  <div className="text-center">
                    <div className="flex justify-center">
                      <Image
                        src="/miami-ai-logo.png"
                        alt="MIAMI.AI"
                        width={294}
                        height={59}
                        className="neon-glow max-w-full h-auto"
                        priority
                      />
                    </div>
                  </div>

                  <div className="w-full max-w-3xl px-4 space-y-4 sm:space-y-6">
                    <div className="w-full">
                      <SearchInput
                        ref={searchInputRef}
                        onSearch={handleSearch}
                        isLoading={isLoading}
                        mode={mode}
                        onModeChange={setMode}
                        onCancel={handleCancelSearch}
                        recentSearches={recentSearches}
                        user={user}
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                      />
                    </div>

                    {/* Example Search Queries */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {[
                        { query: "What are the best tech startups in Miami right now?", category: "Miami Business" },
                        { query: "Compare Miami's real estate market to other major cities", category: "Real Estate" },
                        { query: "What's happening in Miami's AI and tech scene?", category: "Technology" },
                        {
                          query: "Best practices for hurricane preparedness in South Florida",
                          category: "Local Living",
                        },
                        { query: "Explain the latest developments in quantum computing", category: "Technology" },
                        { query: "What are the environmental challenges facing Miami Beach?", category: "Environment" },
                      ].map((example, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(example.query, mode)}
                          className={`group relative p-4 sm:p-5 rounded-xl border-2 border-border/50 hover:border-miami-aqua/50 bg-background/50 hover:bg-miami-aqua/5 transition-all duration-300 text-left hover:shadow-lg hover:shadow-miami-aqua/10 ${index >= 3 ? "hidden sm:block" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-miami-aqua mt-2 group-hover:animate-pulse flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-foreground group-hover:text-miami-aqua transition-colors line-clamp-2">
                                {example.query}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1.5">{example.category}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {user && (
                <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] space-y-8 sm:space-y-12 animate-in fade-in duration-700 justify-center pb-32">
                  {/* Personalized Greeting */}
                  <div className="text-center space-y-3">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple bg-clip-text text-transparent">
                      Hello, {user.name || "there"}
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground">How can I help you today?</p>
                  </div>

                  {/* Feature Action Buttons */}
                  <FeatureActions onActionClick={handleFeatureAction} />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isLoading && !response ? (
                <SkeletonSearch />
              ) : response ? (
                <>
                  <div className="space-y-4">
                    {user && currentModelInfo && (
                      <div className="flex justify-center">
                        <ModelBadge
                          model={currentModelInfo.model}
                          reason={currentModelInfo.reason}
                          autoSelected={currentModelInfo.autoSelected}
                        />
                      </div>
                    )}
                    <SearchResponse response={response} citations={citations} isStreaming={isLoading} />
                  </div>
                  {!isLoading && response && (
                    <RelatedSearches searches={relatedSearches} onSelect={(search) => handleSearch(search, mode)} />
                  )}
                </>
              ) : (
                <EmptyState type="no-results" onAction={handleClearSearch} />
              )}
            </div>
          )}
        </main>

        {/* History Sidebar */}
        {showHistory && (
          <HistorySidebar
            userId={userId}
            onClose={() => setShowHistory(false)}
            onSelectHistory={handleSelectHistory}
            localSearches={recentSearches}
          />
        )}

        {/* Fixed Search Bar at Bottom - Only on results page */}
        {(hasSearched || user) && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 transition-all duration-300 ${isSidebarCollapsed ? "md:left-16" : "md:left-64"}`}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
              <SearchInput
                ref={searchInputRef}
                onSearch={handleSearch}
                isLoading={isLoading}
                mode={mode}
                onModeChange={setMode}
                onCancel={handleCancelSearch}
                recentSearches={recentSearches}
                user={user}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
              />
              {rateLimitInfo && (
                <div className="text-center text-xs text-muted-foreground">
                  {rateLimitInfo.remaining} of {rateLimitInfo.limit} queries remaining today
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
