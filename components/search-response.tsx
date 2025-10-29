"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import type { JSX } from "react/jsx-runtime"

interface Citation {
  title: string
  url: string
  snippet: string
}

interface SearchResponseProps {
  response: string
  citations: Citation[]
  isStreaming?: boolean
}

export function SearchResponse({ response, citations, isStreaming }: SearchResponseProps) {
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

  const renderResponseWithCitations = (text: string) => {
    // This allows citation markers to be rendered as numbers until citations load

    // Match patterns like [Source 1], [1], [Source 2], etc.
    const citationPattern = /\[(?:Source\s*)?(\d+)\]/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    while ((match = citationPattern.exec(text)) !== null) {
      // Add text before the citation
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      const citationNumber = Number.parseInt(match[1])
      const citation = safeCitations[citationNumber - 1]

      const sourceName = citation ? getSourceName(citation) : citationNumber.toString()
      const citationUrl = citation?.url || "#"

      parts.push(
        <a
          key={`citation-${match.index}`}
          href={citationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center align-baseline text-[0.75em] font-medium px-1.5 py-0.5 mx-0.5 rounded-md bg-miami-aqua/10 text-miami-aqua border border-miami-aqua/30 hover:bg-miami-aqua/20 hover:border-miami-aqua/50 hover:scale-105 transition-all duration-200 cursor-pointer no-underline"
          aria-label={`Open source: ${sourceName}`}
          title={citation?.title || "View source"}
          onClick={(e) => {
            if (!citation) {
              e.preventDefault()
            }
          }}
        >
          {sourceName}
          {citation && <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" aria-hidden="true" />}
        </a>,
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  if (!response) return null

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Response Card */}
      <div
        className="bg-gradient-to-br from-miami-aqua/10 to-miami-pink/10 border border-miami-aqua/30 rounded-xl p-6 backdrop-blur-sm hover:border-miami-aqua/50 transition-all duration-300 hover:shadow-lg hover:shadow-miami-aqua/10"
        role="article"
        aria-label="Search response"
      >
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground leading-relaxed text-balance whitespace-pre-wrap break-words">
            {renderResponseWithCitations(displayedText)}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-miami-aqua animate-pulse ml-1" aria-label="Loading" />
            )}
          </p>
        </div>
      </div>

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
                    <ExternalLink
                      className="w-4 h-4 text-muted-foreground group-hover:text-miami-aqua transition-all duration-300 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
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
}
