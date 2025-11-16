"use client"

import type { RefObject } from "react"
import { SearchInput, type SearchInputRef } from "@/components/search-input"
import type { User, ModelId, Attachment, RateLimitInfo } from "@/types"

interface SearchFormContainerProps {
  searchInputRef: RefObject<SearchInputRef>
  onSearch: (query: string, mode: "quick" | "deep", attachments?: Attachment[]) => void
  isLoading: boolean
  mode: "quick" | "deep"
  onModeChange: (mode: "quick" | "deep") => void
  onCancel: () => void
  recentSearches: string[]
  user: User | null
  selectedModel: ModelId
  onModelChange: (model: ModelId) => void
  onHistoryClick: () => void
  contentType: "search" | "image"
  onContentTypeChange: (type: "search" | "image") => void
  rateLimitInfo: RateLimitInfo | null
  imageRateLimit: RateLimitInfo | null
  isSidebarCollapsed: boolean
  hasSearched: boolean
}

export function SearchFormContainer({
  searchInputRef,
  onSearch,
  isLoading,
  mode,
  onModeChange,
  onCancel,
  recentSearches,
  user,
  selectedModel,
  onModelChange,
  onHistoryClick,
  contentType,
  onContentTypeChange,
  rateLimitInfo,
  imageRateLimit,
  isSidebarCollapsed,
  hasSearched,
}: SearchFormContainerProps) {
  // Only show when user has searched or is authenticated
  if (!hasSearched && !user) {
    return null
  }

  const showSearchRateWarning = rateLimitInfo && rateLimitInfo.remaining / rateLimitInfo.limit < 0.25
  const showImageRateWarning = imageRateLimit && imageRateLimit.remaining / imageRateLimit.limit < 0.25

  const searchWarningLevel = rateLimitInfo ? rateLimitInfo.remaining / rateLimitInfo.limit : 1
  const isSearchCritical = searchWarningLevel < 0.1

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90"
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 md:py-4 space-y-3">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <SearchInput
              ref={searchInputRef}
              onSearch={onSearch}
              isLoading={isLoading}
              mode={mode}
              onModeChange={onModeChange}
              onCancel={onCancel}
              recentSearches={recentSearches}
              user={user}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              onHistoryClick={onHistoryClick}
              contentType={contentType}
              onContentTypeChange={onContentTypeChange}
            />
          </div>
        </div>

        {contentType === "image" && showImageRateWarning && (
          <div
            className="text-center text-sm md:text-xs font-medium"
            style={{
              animation: "fade-in var(--duration-normal) var(--easing-standard)",
              transform: "translateY(0)",
            }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-yellow-600 dark:text-yellow-500">
                {imageRateLimit!.remaining} of {imageRateLimit!.limit} images remaining today
              </span>
            </div>
          </div>
        )}
        {contentType === "search" && showSearchRateWarning && (
          <div
            className="text-center text-sm md:text-xs font-medium"
            style={{
              animation: "fade-in var(--duration-normal) var(--easing-standard)",
              transform: "translateY(0)",
            }}
          >
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                isSearchCritical
                  ? "bg-red-500/10 border border-red-500/30"
                  : "bg-yellow-500/10 border border-yellow-500/30"
              }`}
            >
              <svg
                className={`w-4 h-4 ${isSearchCritical ? "text-red-500" : "text-yellow-500"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span
                className={isSearchCritical ? "text-red-600 dark:text-red-500" : "text-yellow-600 dark:text-yellow-500"}
              >
                {rateLimitInfo!.remaining} of {rateLimitInfo!.limit} queries remaining today
                {isSearchCritical && " • Please upgrade to continue"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
