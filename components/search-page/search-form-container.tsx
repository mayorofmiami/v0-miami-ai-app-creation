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

  const showSearchRateWarning = rateLimitInfo && rateLimitInfo.remaining / rateLimitInfo.limit < 0.2
  const showImageRateWarning = imageRateLimit && imageRateLimit.remaining / imageRateLimit.limit < 0.2

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 transition-all duration-300 ${isSidebarCollapsed ? "md:left-16" : "md:left-64"}`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-4 space-y-3">
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

        {/* Rate Limit Displays - only show when low */}
        {contentType === "image" && showImageRateWarning && (
          <div className="text-center text-sm md:text-xs text-yellow-600 dark:text-yellow-500 font-medium">
            ⚠️ {imageRateLimit!.remaining} of {imageRateLimit!.limit} images remaining today
          </div>
        )}
        {contentType === "search" && showSearchRateWarning && (
          <div className="text-center text-sm md:text-xs text-yellow-600 dark:text-yellow-500 font-medium">
            ⚠️ {rateLimitInfo!.remaining} of {rateLimitInfo!.limit} queries remaining today
          </div>
        )}
      </div>
    </div>
  )
}
