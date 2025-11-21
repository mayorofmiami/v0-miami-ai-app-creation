"use client"

import { useReducer, useCallback, useState, useRef } from "react"
import { searchReducer } from "@/lib/reducers/search-reducer"
import { SearchInput } from "@/components/search-input"
import { SearchResponse } from "@/components/search-response"
import { ExampleQueries } from "@/components/example-queries"
import { ModelSelector } from "@/components/model-selector"
import { Button } from "@/components/ui/button"
import { HistoryIcon, BookmarkIcon } from "lucide-react"
import type { ModelId } from "@/types"

interface AuthenticatedLandingProps {
  user: any
}

export function AuthenticatedLanding({ user }: AuthenticatedLandingProps) {
  const [state, dispatch] = useReducer(searchReducer, {
    query: "",
    messages: [],
    isLoading: false,
    hasSearched: false,
    selectedModel: "auto" as ModelId,
    currentThreadId: null,
    error: null,
  })

  const [showHistory, setShowHistory] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || state.isLoading) return

      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

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
            userId: user.id,
            threadId: state.currentThreadId,
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

          // Update UI with streaming text
          dispatch({
            type: "UPDATE_STREAMING",
            payload: accumulatedText,
          })
        }

        // Complete the message
        dispatch({
          type: "COMPLETE_SEARCH",
          payload: {
            id: crypto.randomUUID(),
            role: "assistant",
            content: accumulatedText,
            model: state.selectedModel,
            timestamp: new Date(),
          },
        })
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Search aborted")
          return
        }

        dispatch({
          type: "SET_ERROR",
          payload: error.message || "Search failed",
        })
      }
    },
    [state.selectedModel, state.isLoading, state.currentThreadId, user.id],
  )

  const handleModelChange = useCallback((model: ModelId) => {
    dispatch({ type: "SET_MODEL", payload: model })
  }, [])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      dispatch({ type: "STOP_SEARCH" })
    }
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - History */}
      {showHistory && (
        <div className="w-64 border-r border-border bg-card">
          <div className="p-4">
            <h2 className="text-lg font-semibold">History</h2>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <HistoryIcon className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple bg-clip-text text-transparent">
                Miami.AI
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <ModelSelector value={state.selectedModel} onChange={handleModelChange} />
              <Button variant="ghost" size="sm" onClick={() => setShowBookmarks(!showBookmarks)}>
                <BookmarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {!state.hasSearched ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold">Welcome back, {user.displayName || "there"}</h2>
                  <p className="text-lg text-muted-foreground">What would you like to explore today?</p>
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
                {state.error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{state.error}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Search Input - Fixed at bottom */}
        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-3xl mx-auto p-4">
            <SearchInput
              onSearch={handleSearch}
              isLoading={state.isLoading}
              onStop={handleStop}
              selectedModel={state.selectedModel}
              onModelChange={handleModelChange}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Bookmarks */}
      {showBookmarks && (
        <div className="w-64 border-l border-border bg-card">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Bookmarks</h2>
          </div>
        </div>
      )}
    </div>
  )
}
