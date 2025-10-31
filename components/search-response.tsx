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
}

export const SearchResponse = memo(function SearchResponse({
  response,
  citations,
  isStreaming,
  actions,
  modelBadge,
}: SearchResponseProps) {
  const [displayedText, setDisplayedText] = useState("")

  const safeCitations = citations || []

  useEffect(() => {
    if (isStreaming) {
      setDisplayedText(response)
    } else {
      // Typing animation for completed responses
      let index = 0
      setDisplayedText("")
      const interval = setInterval(() => {
        if (index < response.length) {
          setDisplayedText(response.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
        }
      }, 10)
      return () => clearInterval(interval)
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
    const citationPattern = /\[(?:Source\s*)?(\d+(?:\s*,\s*\d+)*)\]/g
    return text.replace(citationPattern, (match, citationNums) => {
      // Split by comma to handle multiple citations
      const numbers = citationNums.split(/\s*,\s*/).map((n: string) => Number.parseInt(n.trim()))

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
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Response Card */}
      <div className="prose prose-invert prose-miami max-w-none" role="article" aria-label="Search response">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-foreground mb-2 mt-4 first:mt-0">{children}</h3>
            ),
            p: ({ children }) => <p className="text-foreground leading-relaxed mb-4 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground">{children}</ul>,
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground">{children}</ol>
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
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-miami-aqua hover:text-miami-aqua/80 underline decoration-miami-aqua/30 hover:decoration-miami-aqua/60 transition-colors"
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              <div className="my-4 rounded-lg overflow-hidden border border-miami-aqua/30">
                <img
                  src={src || "/placeholder.svg"}
                  alt={alt || ""}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
                {alt && <p className="text-xs text-muted-foreground text-center py-2 bg-muted/30">{alt}</p>}
              </div>
            ),
            hr: () => <hr className="my-6 border-t border-miami-aqua/30" />,
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
                  className="inline-flex items-center align-baseline text-[0.75em] font-medium px-1.5 py-0.5 mx-0.5 rounded-md bg-miami-aqua/10 text-miami-aqua border border-miami-aqua/30 hover:bg-miami-aqua/20 hover:border-miami-aqua/50 hover:scale-105 transition-all duration-200 cursor-pointer no-underline"
                  aria-label={`Open source: ${sourceName}`}
                  title={citation.title}
                >
                  {sourceName}
                  <span className="ml-1 text-[0.6em]">↗</span>
                </a>
              )
            },
          }}
        >
          {processedText}
        </ReactMarkdown>
        {isStreaming && <span className="inline-block w-2 h-5 bg-miami-aqua animate-pulse ml-1" aria-label="Loading" />}
      </div>

      {/* Actions and Model Badge Row */}
      {(actions || modelBadge) && (
        <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
          <div className="flex-1">{actions}</div>
          {modelBadge && <div className="flex-shrink-0">{modelBadge}</div>}
        </div>
      )}

      {/* Citations */}
      {safeCitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sources</h3>
          <div className="grid gap-3" role="list" aria-label="Source citations">
            {safeCitations.map((citation, index) => (
              <a
                key={index}
                id={`citation-${index + 1}`}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border hover:border-miami-aqua/50 transition-all duration-300 max-w-full overflow-hidden hover:shadow-md hover:shadow-miami-aqua/10 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 scroll-mt-20"
                style={{ animationDelay: `${index * 100}ms` }}
                role="listitem"
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-miami-aqua/20 flex items-center justify-center text-miami-aqua font-bold text-sm group-hover:bg-miami-aqua/30 group-hover:scale-110 transition-all duration-300"
                  aria-label={`Source ${index + 1}`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground group-hover:text-miami-aqua transition-colors break-all">
                      {citation.title}
                    </h4>
                    <span className="text-muted-foreground group-hover:text-miami-aqua transition-all duration-300 flex-shrink-0 text-sm">
                      ↗
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-all">{citation.snippet}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 break-all" title={citation.url}>
                    {citation.url}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
