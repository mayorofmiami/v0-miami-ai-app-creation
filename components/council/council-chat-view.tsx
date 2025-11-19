"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CouncilMessage } from "@/types"

interface CouncilChatViewProps {
  message: CouncilMessage
}

export function CouncilChatView({ message }: CouncilChatViewProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([3])) // Verdict always expanded

  const responses = message.responses || []
  const advisors = message.advisors || []
  
  // Group responses by round
  const responsesByRound: Record<number, typeof responses> = {}
  responses.forEach((r) => {
    if (!responsesByRound[r.round]) {
      responsesByRound[r.round] = []
    }
    responsesByRound[r.round].push(r)
  })

  const completedRounds = Object.keys(responsesByRound).map(Number).sort()
  const hasVerdict = !!message.verdict

  const toggleRound = (round: number) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(round)) {
      newExpanded.delete(round)
    } else {
      newExpanded.add(round)
    }
    setExpandedRounds(newExpanded)
  }

  const getRoundTitle = (round: number) => {
    if (round === 1) return "Round 1: Opening Positions"
    if (round === 2) return "Round 2: Debate & Counter-Arguments"
    return "Round 3: Final Analysis"
  }

  return (
    <div className="space-y-4">
      {/* Council Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20">
        <span className="text-2xl">🏛️</span>
        <div className="flex-1">
          <h3 className="font-semibold">Council Debate</h3>
          {message.councilName && (
            <p className="text-sm text-muted-foreground">{message.councilName}</p>
          )}
        </div>
        <Badge variant="secondary">{advisors.length} advisors</Badge>
      </div>

      {/* Rounds */}
      {completedRounds.map((round) => {
        const roundResponses = responsesByRound[round] || []
        const isExpanded = expandedRounds.has(round)
        const responseCount = roundResponses.length

        return (
          <Card key={round} className="overflow-hidden">
            <button
              onClick={() => toggleRound(round)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-semibold">
                  {round}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold">{getRoundTitle(round)}</h4>
                  <p className="text-xs text-muted-foreground">
                    {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t p-4 space-y-4">
                {roundResponses.map((response, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{response.advisorArchetype === 'visionary' ? '🚀' : 
                                                   response.advisorArchetype === 'guardian' ? '🛡️' :
                                                   response.advisorArchetype === 'sage' ? '🧙' :
                                                   response.advisorArchetype === 'contrarian' ? '⚡' :
                                                   response.advisorArchetype === 'realist' ? '🎯' : '👤'}</span>
                      <span className="font-medium text-sm">{response.advisorName}</span>
                      <Badge variant="outline" className="text-xs">{response.modelUsed}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed pl-7">{response.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}

      {/* Final Verdict */}
      {hasVerdict && (
        <Card className="p-6 border-2 border-purple-500/30 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">⚖️</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">Final Verdict</h3>
              <p className="text-xs text-muted-foreground">Synthesized recommendation from all advisors</p>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {message.verdict.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-foreground leading-relaxed mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </Card>
      )}

      {message.isStreaming && !hasVerdict && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="ml-2">Council deliberating...</span>
        </div>
      )}
    </div>
  )
}
