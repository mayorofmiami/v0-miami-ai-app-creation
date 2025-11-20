"use client"

import { useState } from "react"
import type { BoardroomMessage } from "@/types"
import { PersonaCard } from "./persona-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Users, Sparkles } from "lucide-react"

interface BoardroomViewProps {
  message: BoardroomMessage
}

export function BoardroomView({ message }: BoardroomViewProps) {
  const [showAllOpinions, setShowAllOpinions] = useState(true)
  const [votes, setVotes] = useState<Record<string, "agree" | "disagree" | null>>({})

  const responses = message.responses || []
  const personas = message.personas || []

  // If no data yet, show loading state
  if (personas.length === 0 && responses.length === 0 && !message.synthesis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-8 h-8 border-4 border-miami-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">The council is convening...</p>
      </div>
    )
  }

  const opinions = responses.filter((r) => r.round === 1)
  const hasSynthesis = !!message.synthesis

  const handleVote = (personaName: string, voteType: "agree" | "disagree") => {
    setVotes((prev) => ({
      ...prev,
      [personaName]: prev[personaName] === voteType ? null : voteType,
    }))
  }

  const getTLDR = (content: string) => {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || []
    return sentences.slice(0, 2).join(" ").trim()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-8">
      {/* Council Opinions Section */}
      {opinions.length > 0 && (
        <div className="space-y-4">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
            onClick={() => setShowAllOpinions(!showAllOpinions)}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-semibold">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Council Opinions</h2>
              <p className="text-sm text-muted-foreground">
                {personas.length} council members have shared their perspectives
              </p>
            </div>
            <Button variant="ghost" size="sm">
              {showAllOpinions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {showAllOpinions && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {personas.map((persona) => {
                const response = opinions.find((r) => r.persona === persona.name)

                return (
                  <PersonaCard
                    key={persona.name}
                    name={persona.name}
                    role={persona.role}
                    avatar={persona.avatar}
                    model={persona.model || "Unknown"}
                    responses={response ? [response] : []}
                    currentRound={1}
                    tldr={response?.content ? getTLDR(response.content) : undefined}
                    vote={votes[persona.name] || null}
                    onVote={(voteType) => handleVote(persona.name, voteType)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Chairman's Synthesis */}
      {hasSynthesis && (
        <div className="space-y-4">
          <Card className="p-6 border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Final Recommendation</h3>
                <Badge variant="secondary" className="mt-1">
                  GPT-4O
                </Badge>
              </div>
            </div>

            <div className="space-y-4 text-base leading-relaxed">
              {message.synthesis.split("\n\n").map((paragraph, i) => {
                // Check if paragraph looks like a bullet point section
                if (paragraph.includes("\n- ") || paragraph.includes("\n• ")) {
                  const lines = paragraph.split("\n")
                  const title = lines[0]
                  const bullets = lines.slice(1).filter((l) => l.trim())

                  return (
                    <div key={i} className="space-y-2">
                      {title && <p className="font-semibold">{title}</p>}
                      <ul className="space-y-2 list-disc list-inside">
                        {bullets.map((bullet, j) => (
                          <li key={j} className="leading-relaxed">
                            {bullet.replace(/^[•-]\s*/, "")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                }

                return (
                  <p key={i} className="leading-relaxed">
                    {paragraph}
                  </p>
                )
              })}
            </div>

            {!showAllOpinions && (
              <div className="mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setShowAllOpinions(true)} className="w-full">
                  View All Council Opinions
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Loading state for synthesis */}
      {!hasSynthesis && opinions.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="ml-2">Preparing final recommendation...</span>
        </div>
      )}
    </div>
  )
}
