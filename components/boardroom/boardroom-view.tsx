"use client"

import { useState } from "react"
import type { BoardroomMessage } from "@/types"
import { ChevronDown, ChevronUp, FileText, User, Sparkles } from "lucide-react"

interface BoardroomViewProps {
  message: BoardroomMessage
}

export function BoardroomView({ message }: BoardroomViewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const responses = message.responses || []
  const personas = message.personas || []
  const hasSynthesis = !!message.synthesis

  // If no data yet, show loading state
  if (personas.length === 0 && responses.length === 0 && !message.synthesis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-mono text-sm">GENERATING INTELLIGENCE BRIEFING...</p>
      </div>
    )
  }

  const opinions = responses.filter((r) => r.round === 1)

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const parseMarkdown = (text: string) => {
    // Remove markdown bold syntax
    return text.replace(/\*\*(.+?)\*\*/g, "$1")
  }

  const formatSynthesis = (synthesis: string) => {
    const cleaned = parseMarkdown(synthesis)
    const sections = cleaned.split("\n\n")

    return sections.map((section, i) => {
      // Check if it's a bullet list
      if (section.includes("\n- ") || section.includes("\n• ")) {
        const lines = section.split("\n")
        const title = lines[0]
        const bullets = lines.slice(1).filter((l) => l.trim())

        return (
          <div key={i} className="mb-6">
            {title && <p className="font-medium text-lg mb-3">{title}</p>}
            <ul className="space-y-2 pl-4 border-l-2 border-primary/20">
              {bullets.map((bullet, j) => (
                <li key={j} className="leading-relaxed text-base text-muted-foreground">
                  {bullet.replace(/^[•-]\s*/, "")}
                </li>
              ))}
            </ul>
          </div>
        )
      }

      // Regular paragraph
      return (
        <p key={i} className="leading-relaxed text-base mb-4 text-foreground/90">
          {section}
        </p>
      )
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8 border-b pb-6">
        <div className="flex items-center gap-2 mb-2 text-primary font-mono text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Intelligence Briefing</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Council Recommendation</h1>
        <p className="text-muted-foreground mt-2">Synthesized analysis from {personas.length} expert perspectives.</p>
      </div>

      {/* Executive Summary (Synthesis) */}
      {hasSynthesis && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Executive Summary</h2>
          </div>

          <div className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
            <div className="prose prose-neutral dark:prose-invert max-w-none">{formatSynthesis(message.synthesis)}</div>
          </div>
        </section>
      )}

      {/* Analyst Notes (Personas) */}
      {opinions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Analyst Notes</h2>
            </div>
            <span className="text-sm text-muted-foreground font-mono">{opinions.length} REPORTS FILED</span>
          </div>

          <div className="grid gap-4">
            {personas.map((persona, index) => {
              const response = opinions.find((r) => r.persona === persona.name)
              const isExpanded = expandedSections[persona.name] ?? false

              if (!response) return null

              return (
                <div
                  key={persona.name}
                  className="border rounded-lg overflow-hidden bg-card transition-all duration-200 hover:border-primary/50"
                >
                  <button
                    onClick={() => toggleSection(persona.name)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                        {persona.avatar ? (
                          <img
                            src={persona.avatar || "/placeholder.svg"}
                            alt={persona.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">{persona.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{persona.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                          {persona.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:inline-block">
                        {isExpanded ? "COLLAPSE" : "EXPAND"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-6 pt-0 border-t bg-muted/10 animate-in slide-in-from-top-2 duration-200">
                      <div className="pt-4 prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                        {response.content.split("\n").map((paragraph, i) => (
                          <p key={i} className="mb-3 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Loading state for synthesis */}
      {!hasSynthesis && opinions.length > 0 && (
        <div className="mt-8 p-4 border border-dashed rounded-lg bg-muted/30 flex items-center justify-center gap-3 text-muted-foreground font-mono text-sm">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>SYNTHESIZING FINAL REPORT...</span>
        </div>
      )}
    </div>
  )
}
