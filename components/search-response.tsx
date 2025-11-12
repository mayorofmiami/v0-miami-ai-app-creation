"use client"

import { useEffect, useState, memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import type { ReactNode } from "react"

interface Citation {
  title: string
  url: string
  snippet: string
}

interface SearchResponseProps {
  response: string
  citations: Citation[]
  isStreaming?: boolean
  actions?: ReactNode
  modelBadge?: ReactNode
  relatedButton?: ReactNode
  relatedContent?: ReactNode
}

export const SearchResponse = memo(function SearchResponse({
  response,
  citations,
  isStreaming,
  actions,
  modelBadge,
  relatedButton,
  relatedContent,
}: SearchResponseProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)

  const safeCitations = citations || []

  useEffect(() => {
    if (isStreaming) {
      if (response.length === 0) {
        setShowTypingIndicator(true)
        setTimeout(() => setShowTypingIndicator(false), 800)
      }
      setDisplayedText(response)
    } else {
      setDisplayedText(response)
      setShowTypingIndicator(false)
    }
  }, [response, isStreaming])

  const getSourceName = (citation: Citation): string => {
    try {
      const url = new URL(citation.url)
      const domain = url.hostname.replace("www.", "")
      const mainDomain = domain.split(".")[0]
      const sourceName = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1)
      return sourceName
    } catch (error) {
      // Fallback: use first word of title
      const firstWord = citation.title.split(" ")[0]
      return firstWord.length > 12 ? firstWord.slice(0, 12) : firstWord
    }
  }

  const processTextWithCitations = (text: string) => {
    let emojiCitationCounter = 0
    let processedText = text.replace(/\[🔗\s*Source\]/gi, () => {
      emojiCitationCounter++
      return `[Source ${emojiCitationCounter}]`
    })

    processedText = processedText.replace(
      /\[(?:Source\s*)?\d+(?:\s*,\s*(?:Source\s*)?\d+)*\]\s*[(]https?:\/\/[^)]+[)]/g,
      (match) => {
        return match.replace(/\s*[(]https?:\/\/[^)]+[)]/, "")
      },
    )

    processedText = processedText.replace(/\s*[(]https?:\/\/[^)]+[)]/g, "")

    processedText = processedText.replace(/[(]\s*[)]/g, "")

    processedText = processedText.replace(/(\[(?:Source\s*)?\d+(?:\s*,\s*(?:Source\s*)?\d+)*\])[.,;:!?]+/g, "$1")

    const citationPattern = /\[(?:Source\s*)?(\d+(?:\s*,\s*(?:Source\s*)?\d+)*)\]/g
    return processedText.replace(citationPattern, (match, citationNums) => {
      // Split by comma and extract just the numbers
      const numbers = citationNums.split(/\s*,\s*/).map((n: string) => {
        // Handle both "1" and "Source 1" formats
        const num = n.replace(/Source\s*/i, "").trim()
        return Number.parseInt(num)
      })

      // Create a cite element for each citation number
      return numbers
        .map((citationNumber: number) => {
          const citation = safeCitations[citationNumber - 1]
          if (!citation) return `[Source ${citationNumber}]`

          const sourceName = getSourceName(citation)
          return `<cite data-num="${citationNumber}" data-name="${sourceName}" data-url="${citation.url}"></cite>`
        })
        .join("")
    })
  }

  const processedText = processTextWithCitations(displayedText)

  if (!response) return null

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {showTypingIndicator && response.length === 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-miami-aqua rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-miami-aqua rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-miami-aqua rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="font-medium">Thinking...</span>
        </div>
      )}

      {/* Response Text */}
      <div className="prose prose-invert prose-miami max-w-none" role="article" aria-label="Search response">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-foreground mb-6 mt-8 first:mt-0 text-balance leading-tight tracking-tight">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold text-foreground mb-5 mt-7 first:mt-0 text-balance leading-snug tracking-tight">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold text-foreground mb-4 mt-6 first:mt-0 text-balance tracking-tight">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-foreground leading-relaxed mb-5 last:mb-0 text-pretty">{children}</p>
            ),
            ul: ({ children }) => <ul className="list-disc list-inside space-y-3 mb-6 text-foreground">{children}</ul>,
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-3 mb-6 text-foreground">{children}</ol>
            ),
            li: ({ children }) => <li className="text-foreground leading-relaxed">{children}</li>,
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-miami-aqua/30 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-miami-aqua/20">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-miami-aqua/20">{children}</tbody>,
            tr: ({ children }) => <tr className="hover:bg-miami-aqua/10 transition-colors">{children}</tr>,
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-sm font-semibold text-foreground border border-miami-aqua/30">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-foreground border border-miami-aqua/30">{children}</td>
            ),
            code: ({ inline, children, ...props }: any) => {
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 rounded bg-miami-aqua/20 text-miami-aqua font-mono text-sm">
                    {children}
                  </code>
                )
              }
              return (
                <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto mb-4 border border-miami-aqua/20">
                  <code className="text-sm font-mono text-foreground" {...props}>
                    {children}
                  </code>
                </pre>
              )
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-miami-aqua/50 pl-4 py-2 my-4 italic text-muted-foreground bg-miami-aqua/5 rounded-r">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-miami-aqua hover:text-miami-aqua/80 underline decoration-miami-aqua/30 hover:decoration-miami-aqua/60 transition-colors"
                >
                  {children}
                </a>
              )
            },
            img: ({ src, alt }) => (
              <div className="my-4 rounded-lg overflow-hidden border border-miami-aqua/30">
                <img
                  src={src || "/placeholder.svg"}
                  alt={alt || "Image from search result"}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
                {alt && <p className="text-xs text-muted-foreground text-center py-2 bg-muted/30">{alt}</p>}
              </div>
            ),
            hr: () => <hr className="my-8 border-t-2 border-miami-aqua/20" />,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic text-foreground">{children}</em>,
            cite: ({ node }: any) => {
              const citationNumber = node?.properties?.dataNum
              const sourceName = node?.properties?.dataName
              const citationUrl = node?.properties?.dataUrl

              const citation = safeCitations[citationNumber - 1]

              if (!citation) return null

              return (
                <a
                  href={citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mx-0.5 px-1.5 text-[9px] font-medium rounded-full bg-miami-aqua/10 text-miami-aqua/90 hover:bg-miami-aqua/20 hover:text-miami-aqua transition-colors cursor-pointer no-underline whitespace-nowrap align-middle"
                  style={{
                    height: "16px",
                    lineHeight: "16px",
                    minHeight: "16px",
                    maxHeight: "16px",
                    verticalAlign: "middle",
                    display: "inline-block",
                  }}
                  aria-label={`Open source: ${sourceName}`}
                  title={citation.title}
                >
                  {sourceName}
                </a>
              )
            },
          }}
        >
          {processedText}
        </ReactMarkdown>
        {isStreaming && (
          <span
            className="inline-block w-2 h-5 bg-miami-aqua animate-pulse ml-1 rounded-sm"
            aria-label="Loading"
            aria-live="polite"
          />
        )}
      </div>

      {(actions || modelBadge || safeCitations.length > 0 || relatedButton) && (
        <div className="space-y-4">
          {modelBadge && (
            <div className="flex items-center gap-4 px-4">
              <div className="flex-1 h-px bg-border/30" />
              <div className="text-xs text-muted-foreground/70 font-medium">{modelBadge}</div>
              <div className="flex-1 h-px bg-border/30" />
            </div>
          )}

          <div className="border-t border-border/30 pt-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Action buttons */}
              <div className="flex-shrink-0">{actions}</div>

              {/* Right: Sources button + Related button */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {/* Sources button */}
                {safeCitations.length > 0 && (
                  <button
                    onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent"
                    aria-expanded={isSourcesExpanded}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Sources</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isSourcesExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {/* Related button */}
                {relatedButton}
              </div>
            </div>
          </div>

          {/* Sources expanded content */}
          {safeCitations.length > 0 && isSourcesExpanded && (
            <div id="sources-list" className="grid gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              {safeCitations.map((citation, index) => (
                <a
                  key={index}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border hover:border-miami-aqua/50 transition-all duration-200 max-w-full overflow-hidden"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-sm group-hover:text-miami-aqua transition-colors border border-border">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-foreground group-hover:text-miami-aqua transition-colors line-clamp-1">
                        {citation.title}
                      </h4>
                      <span className="text-muted-foreground group-hover:text-miami-aqua transition-colors flex-shrink-0 text-xs">
                        ↗
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {citation.snippet}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 truncate font-mono">{citation.url}</p>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Related expanded content */}
          {relatedContent}
        </div>
      )}
    </div>
  )
})
