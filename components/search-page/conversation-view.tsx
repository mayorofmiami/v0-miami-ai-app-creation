"use client"

import { Suspense, type MutableRefObject } from "react"
import { SearchResponse } from "@/components/search-response"
import { ImageResult } from "@/components/image-result"
import { RelatedSearches } from "@/components/related-searches"
import { SkeletonSearch } from "@/components/skeleton-search"
import { ResponseActions } from "@/components/response-actions"
import { ModelBadge } from "@/components/model-badge"
import type { ConversationMessage, User, SearchMode } from "@/types"

interface ConversationViewProps {
  messages: ConversationMessage[]
  messageRefs: MutableRefObject<{ [key: string]: HTMLDivElement | null }>
  user: User | null
  searchMode: SearchMode
  onRegenerate: () => void
  onRelatedSearchClick: (search: string) => void
  onImageRegenerate: (prompt: string) => void
}

export function ConversationView({
  messages,
  messageRefs,
  user,
  searchMode,
  onRegenerate,
  onRelatedSearchClick,
  onImageRegenerate,
}: ConversationViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {messages.map((message, index) => (
        <div key={message.id} className="space-y-4">
          {/* Query Display */}
          <div
            ref={(el) => {
              messageRefs.current[message.id] = el
            }}
            className="w-full max-w-3xl mx-auto scroll-mt-24"
          >
            <div className="relative bg-gradient-to-r from-miami-aqua/10 via-miami-blue/10 to-miami-purple/10 rounded-2xl p-[2px] shadow-lg">
              <div className="bg-background rounded-2xl px-4 md:px-5 py-4 flex items-start gap-3">
                <svg
                  className="w-5 h-5 md:w-5 md:h-5 text-miami-aqua flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-base md:text-base text-foreground/90 flex-1 leading-relaxed">{message.query}</p>
              </div>
            </div>
          </div>

          {/* Response */}
          {message.isStreaming && !message.response && !message.generatedImage ? (
            <SkeletonSearch />
          ) : message.response || message.generatedImage ? (
            <>
              <Suspense fallback={<SkeletonSearch />}>
                {message.generatedImage ? (
                  <ImageResult
                    imageUrl={message.generatedImage.url}
                    prompt={message.generatedImage.prompt}
                    model={message.generatedImage.model}
                    resolution={message.generatedImage.resolution}
                    createdAt={message.generatedImage.createdAt}
                    onRegenerate={() => onImageRegenerate(message.generatedImage!.prompt)}
                  />
                ) : (
                  <SearchResponse
                    response={message.response || ""}
                    citations={message.citations || []}
                    isStreaming={message.isStreaming || false}
                    actions={
                      !message.isStreaming && message.response ? (
                        <ResponseActions
                          query={message.query}
                          response={message.response}
                          searchId={message.searchId}
                          userId={user?.id}
                          onRegenerate={onRegenerate}
                        />
                      ) : null
                    }
                    modelBadge={
                      user && message.modelInfo ? (
                        <ModelBadge
                          model={message.modelInfo.model}
                          reason={message.modelInfo.reason}
                          autoSelected={message.modelInfo.autoSelected}
                        />
                      ) : null
                    }
                  />
                )}
              </Suspense>

              {!message.isStreaming && message.response && !message.generatedImage && (
                <Suspense fallback={<div className="h-20" />}>
                  <RelatedSearches query={message.query} onSearchClick={onRelatedSearchClick} />
                </Suspense>
              )}
            </>
          ) : null}
        </div>
      ))}
    </div>
  )
}
