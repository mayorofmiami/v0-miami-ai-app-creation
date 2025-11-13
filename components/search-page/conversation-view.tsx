"use client"

import { Suspense, type MutableRefObject, useState } from "react"
import { SearchResponse } from "@/components/search-response"
import { ImageResult } from "@/components/image-result"
import { RelatedSearches } from "@/components/related-searches"
import { SkeletonSearch } from "@/components/skeleton-search"
import { ResponseActions } from "@/components/response-actions"
import { ModelBadge } from "@/components/model-badge"
import Palmtree from "@/components/icons/Palmtree"
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
  const [expandedRelatedId, setExpandedRelatedId] = useState<string | null>(null)

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {messages.map((message, index) => {
        const isRelatedExpanded = expandedRelatedId === message.id
        const showButtons = !message.isStreaming && message.response

        return (
          <div key={message.id} className="space-y-4 md:space-y-6">
            {/* Query Display - Modern minimal style */}
            <div
              ref={(el) => {
                messageRefs.current[message.id] = el
              }}
              className="w-full max-w-3xl mx-auto scroll-mt-24 px-4 md:px-0"
            >
              <div className="bg-muted/50 border border-border rounded-xl px-3 py-2.5 md:px-5 md:py-4 flex items-center gap-2.5 md:gap-3">
                <Palmtree className="w-4 h-4 md:w-5 md:h-5 text-miami-blue dark:text-miami-aqua flex-shrink-0" />
                <p className="text-sm md:text-base lg:text-lg text-foreground leading-relaxed flex-1">
                  {message.query}
                </p>
              </div>
            </div>

            {/* Response */}
            {message.isStreaming && !message.response && !message.generatedImage ? (
              <SkeletonSearch />
            ) : message.response || message.generatedImage ? (
              <div className="w-full max-w-3xl mx-auto">
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
                    <>
                      <SearchResponse
                        response={message.response || ""}
                        citations={showButtons ? message.citations || [] : []}
                        isStreaming={message.isStreaming || false}
                        actions={
                          showButtons ? (
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
                        relatedButton={
                          showButtons ? (
                            <button
                              onClick={() => setExpandedRelatedId(isRelatedExpanded ? null : message.id)}
                              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent"
                              aria-expanded={isRelatedExpanded}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <span>Related</span>
                              <svg
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isRelatedExpanded ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          ) : null
                        }
                        relatedContent={
                          showButtons && isRelatedExpanded ? (
                            <RelatedSearches
                              query={message.query}
                              onSearchClick={onRelatedSearchClick}
                              renderContentOnly={true}
                            />
                          ) : null
                        }
                      />
                    </>
                  )}
                </Suspense>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
