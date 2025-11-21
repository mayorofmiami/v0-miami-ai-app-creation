"use client"

import type React from "react"

import { useRef, useCallback, useReducer } from "react"
import type { ModelId } from "@/components/model-selector"
import { toast } from "@/lib/toast"
import type { SearchInputRef } from "@/components/search-input"
import type { Attachment } from "@/types"
import type { SearchMode } from "@/types"
import { handleSearchError, handleImageError } from "@/lib/error-handling"
import { searchReducer } from "@/lib/reducers/search-reducer"

interface SearchContainerProps {
  user: any
  selectedModel: ModelId
  currentThreadId: string | null
  setCurrentThreadId: (id: string | null) => void
  searchInputRef: React.RefObject<SearchInputRef>
  onModelChange: (model: ModelId) => Promise<void>
  onRecentSearchAdd: (query: string) => void
}

export function SearchContainer({
  user,
  selectedModel,
  currentThreadId,
  setCurrentThreadId,
  searchInputRef,
  onModelChange,
  onRecentSearchAdd,
}: SearchContainerProps) {
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

  const abortControllerRef = useRef<AbortController | null>(null)

  const handleCancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      dispatchSearch({ type: "SEARCH_ERROR", error: "" })
      dispatchSearch({ type: "SEARCH_COMPLETE" })
    }
  }, [])

  const handleSearch = useCallback(
    async (query: string, searchMode: SearchMode, attachments?: Attachment[]) => {
      if (searchState.isLoading) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      dispatchSearch({ type: "START_SEARCH", query, mode: searchMode })

      try {
        const body: any = { query, mode: searchMode, userId: user.id }

        if (currentThreadId) body.threadId = currentThreadId
        if (selectedModel !== "auto") body.selectedModel = selectedModel
        if (attachments && attachments.length > 0) body.attachments = attachments

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
          const errorMessage = handleSearchError({ error: errorData, user, status: res.status })
          dispatchSearch({ type: "SEARCH_ERROR", error: errorMessage })
          return
        }

        if (!res.ok) {
          const errorData = await res.json()
          const errorMessage = handleSearchError({ error: errorData, user, status: res.status })
          dispatchSearch({ type: "SEARCH_ERROR", error: errorMessage })
          return
        }

        const threadId = res.headers.get("X-Thread-Id")
        if (threadId) setCurrentThreadId(threadId)

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
                // Silent parse error
              }
            }
          }
        }

        dispatchSearch({ type: "SEARCH_COMPLETE" })

        const searchId = res.headers.get("X-Search-Id")
        if (searchId) dispatchSearch({ type: "SET_SEARCH_ID", searchId })

        if (searchMode === "deep") dispatchSearch({ type: "SET_MODE", mode: "quick" })

        searchInputRef.current?.clear()
        onRecentSearchAdd(query)
      } catch (error: any) {
        if (error.name === "AbortError") return

        toast.error("Search failed", error.message || "Please try again")
        dispatchSearch({ type: "SEARCH_ERROR", error: "Sorry, something went wrong. Please try again." })
      } finally {
        abortControllerRef.current = null
      }
    },
    [
      user,
      selectedModel,
      searchState.isLoading,
      searchState.messages,
      currentThreadId,
      setCurrentThreadId,
      onRecentSearchAdd,
    ],
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
          const errorMessage = handleImageError({ error: errorData, status: res.status })
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
    [user, searchState.isLoading, searchInputRef],
  )

  return {
    searchState,
    dispatchSearch,
    handleSearch,
    handleImageGeneration,
    handleCancelSearch,
  }
}
