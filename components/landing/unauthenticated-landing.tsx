"use client"

import { useReducer, useCallback, useState, useRef, useEffect } from "react"
import { searchReducer, initialSearchState } from "@/lib/reducers/search-reducer"
import { SearchInput } from "@/components/search-input"
import { SearchResponse } from "@/components/search-response"
import { ExampleQueries } from "@/components/example-queries"
import { ModelSelector } from "@/components/model-selector"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"
import type { ModelId } from "@/types"
import Link from "next/link"

const FREE_SEARCH_LIMIT = 3

export function UnauthenticatedLanding() {
  const [state, dispatch] = useReducer(searchReducer, {
    ...initialSearchState,
    selectedModel: "openai/gpt-4o-mini" as ModelId,
  })

  const [searchCount, setSearchCount] = useState(0)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load search count from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("freeSearchCount")
    if (stored) {
      setSearchCount(Number.parseInt(stored, 10))
    }
  }, [])

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || state.isLoading) return

      // Check if user has exceeded free searches
      if (searchCount >= FREE_SEARCH_LIMIT) {
        setShowAuthPrompt(true)
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      // Add user message immediately
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: crypto.randomUUID(),
          role: "user",
          content: query,
          timestamp: new Date(),
        },
      })

      dispatch({
        type: "START_SEARCH",
        payload: { query, model: state.selectedModel },
      })

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            model: state.selectedModel,
            mode: "search",
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulatedText = ""

        while (true) {
          const { done, value } = await reader!.read()
          if (done) break

          accumulatedText += decoder.decode(value, { stream: true })

          // Update streaming message
          dispatch({
            type: "UPDATE_CURRENT_MESSAGE",
            payload: accumulatedText,
          })
        }

        // Increment search count
        const newCount = searchCount + 1
        setSearchCount(newCount)
        localStorage.setItem("freeSearchCount", newCount.toString())

        // Show auth prompt if this was the last free search
        if (newCount >= FREE_SEARCH_LIMIT) {
          setTimeout(() => setShowAuthPrompt(true), 1000)
        }

        dispatch({ type: "SET_LOADING", payload: false })
      } catch (error: any) {
        if (error.name === "AbortError") {
          return
        }

        dispatch({
          type: "SET_ERROR",
          payload: error.message || "Search failed",
        })
      }
    },
    [state.selectedModel, state.isLoading, searchCount],
  )

  const handleModelChange = useCallback((model: ModelId) => {
    dispatch({ type: "SET_MODEL", payload: model })
  }, [])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [])

  const remainingSearches = Math.max(0, FREE_SEARCH_LIMIT - searchCount)

  return (
    <>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Logo />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Miami.AI
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <ModelSelector value={state.selectedModel} onChange={handleModelChange} />
              <Link href="/handler/signin">
                <Button variant="default" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {!state.hasSearched ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-bold tracking-tight">Search with AI</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl">
                    Get instant, intelligent answers powered by multiple AI models. Try {remainingSearches} free{" "}
                    {remainingSearches === 1 ? "search" : "searches"} before signing up.
                  </p>
                </div>
                <ExampleQueries onQueryClick={handleSearch} />
              </div>
            ) : (
              <div className="space-y-6">
                {state.messages.map((message) => (
                  <SearchResponse key={message.id} message={message} />
                ))}
                {state.isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>Searching...</span>
                  </div>
                )}
                {state.error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    {state.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Input - Fixed at bottom */}
        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-3xl mx-auto p-4">
            {remainingSearches > 0 ? (
              <>
                <SearchInput
                  onSearch={handleSearch}
                  isLoading={state.isLoading}
                  onStop={handleStop}
                  selectedModel={state.selectedModel}
                  onModelChange={handleModelChange}
                />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {remainingSearches} free {remainingSearches === 1 ? "search" : "searches"} remaining
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">You've used all your free searches</p>
                <Link href="/handler/signup">
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Sign Up for Unlimited Searches
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Prompt Dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Love what you see?</DialogTitle>
            <DialogDescription className="text-base pt-2">
              You've used all {FREE_SEARCH_LIMIT} free searches. Sign up to get:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Unlimited searches</h4>
                <p className="text-sm text-muted-foreground">Search as much as you want with no daily limits</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Advanced AI models</h4>
                <p className="text-sm text-muted-foreground">Access GPT-4, Claude, Gemini, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Search history & bookmarks</h4>
                <p className="text-sm text-muted-foreground">Save and organize your searches</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAuthPrompt(false)} className="flex-1">
              Maybe Later
            </Button>
            <Link href="/handler/signup" className="flex-1">
              <Button className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Sign Up Free
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
