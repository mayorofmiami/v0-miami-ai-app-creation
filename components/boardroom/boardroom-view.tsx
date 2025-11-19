"use client"

import { useState } from 'react'
import { BoardroomMessage } from "@/types"
import { PersonaCard } from "./persona-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, LayoutGrid, List, ThumbsUp, ThumbsDown } from 'lucide-react'

interface BoardroomViewProps {
  message: BoardroomMessage
}

export function BoardroomView({ message }: BoardroomViewProps) {
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set([1]))
  const [viewMode, setViewMode] = useState<'timeline' | 'compare'>('timeline')
  const [votes, setVotes] = useState<Record<string, 'agree' | 'disagree' | null>>({})

  const responses = message.responses || []
  const personas = message.personas || []
  
  const completedRounds = [...new Set(responses.map((r) => r.round))].sort()
  const currentRound = message.synthesis ? 3 : completedRounds.length > 0 ? Math.max(...completedRounds) : 1
  const hasSynthesis = !!message.synthesis

  const getRoundTitle = (round: number) => {
    if (round === 1) return "Round 1: Opening Statements"
    if (round === 2) return "Round 2: Debate & Rebuttals"
    return "Round 3: Chairman's Synthesis"
  }

  const responsesByRound: Record<number, typeof responses> = {}
  responses.forEach((r) => {
    if (!responsesByRound[r.round]) {
      responsesByRound[r.round] = []
    }
    responsesByRound[r.round].push(r)
  })

  const toggleRound = (round: number) => {
    const newCollapsed = new Set(collapsedRounds)
    if (newCollapsed.has(round)) {
      newCollapsed.delete(round)
    } else {
      newCollapsed.add(round)
    }
    setCollapsedRounds(newCollapsed)
  }

  const handleVote = (personaName: string, round: number, voteType: 'agree' | 'disagree') => {
    const key = `${personaName}-${round}`
    setVotes(prev => ({
      ...prev,
      [key]: prev[key] === voteType ? null : voteType
    }))
  }

  const getTLDR = (content: string) => {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || []
    return sentences.slice(0, 2).join(' ').trim()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-8">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Progress indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((round) => {
              const isCompleted = round === 3 ? hasSynthesis : completedRounds.includes(round)
              const isActive = round === currentRound && !hasSynthesis
              
              return (
                <button
                  key={round}
                  onClick={() => {
                    const element = document.getElementById(`round-${round}`)
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : round}
                  <span className="hidden sm:inline">Round {round}</span>
                </button>
              )
            })}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </Button>
            <Button
              variant={viewMode === 'compare' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compare')}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
          </div>
        </div>
      </div>
      {/* </CHANGE> */}

      {viewMode === 'compare' && completedRounds.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {personas.map((persona) => (
            <div key={persona.name} className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{persona.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{persona.name}</h3>
                    <p className="text-xs text-muted-foreground">{persona.role}</p>
                  </div>
                </div>
              </Card>
              {completedRounds.map((round) => {
                const response = responses.find(r => r.persona === persona.name && r.round === round)
                if (!response) return null
                
                return (
                  <Card key={round} className="p-4">
                    <Badge variant="outline" className="mb-2">Round {round}</Badge>
                    <p className="text-sm leading-relaxed">{response.content}</p>
                  </Card>
                )
              })}
            </div>
          ))}
        </div>
      )}
      {/* </CHANGE> */}

      {viewMode === 'timeline' && (
        <>
          {[1, 2].map((round) => {
            const roundResponses = responsesByRound[round] || []
            const isActive = round === currentRound
            const isCompleted = completedRounds.includes(round)
            const isCollapsed = collapsedRounds.has(round)
            
            if (!isCompleted && !isActive) return null

            return (
              <div key={round} id={`round-${round}`} className="space-y-4 scroll-mt-20">
                {/* Round header with collapse toggle */}
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                  onClick={() => isCompleted && toggleRound(round)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  } text-white text-sm font-semibold`}>
                    {isCompleted ? '✓' : round}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                      {getRoundTitle(round)}
                    </h2>
                    {isActive && !hasSynthesis && (
                      <span className="text-sm text-muted-foreground animate-pulse">
                        In progress...
                      </span>
                    )}
                  </div>
                  {isCompleted && (
                    <Button variant="ghost" size="sm">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                  )}
                </div>

                {/* Persona cards grid */}
                {!isCollapsed && personas.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {personas.map((persona) => {
                      const personaResponsesForRound = roundResponses.filter(
                        (r) => r.persona === persona.name
                      )
                      const voteKey = `${persona.name}-${round}`
                      const response = personaResponsesForRound[0]
                      
                      return (
                        <PersonaCard
                          key={`${persona.name}-${round}`}
                          name={persona.name}
                          role={persona.role}
                          avatar={persona.avatar}
                          model={persona.model || 'Unknown'}
                          responses={personaResponsesForRound}
                          currentRound={round}
                          tldr={response?.content ? getTLDR(response.content) : undefined}
                          vote={votes[voteKey] || null}
                          onVote={(voteType) => handleVote(persona.name, round, voteType)}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
      {/* </CHANGE> */}

      {hasSynthesis && (
        <div id="round-3" className="space-y-4 scroll-mt-20">
          <div className="flex items-center gap-3 p-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-semibold">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {getRoundTitle(3)}
              </h2>
            </div>
          </div>

          <Card className="p-6 border-2 border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-purple-500/20">
              <span className="text-3xl">🏛️</span>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Chairman's Synthesis</h3>
                <p className="text-sm text-muted-foreground">Final recommendation from the boardroom</p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  GPT-4O
                </Badge>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none space-y-4">
              {message.synthesis.split('\n\n').map((paragraph, i) => {
                // Check if paragraph looks like a bullet point section
                if (paragraph.includes('\n- ') || paragraph.includes('\n• ')) {
                  const lines = paragraph.split('\n')
                  const title = lines[0]
                  const bullets = lines.slice(1).filter(l => l.trim())
                  
                  return (
                    <div key={i} className="space-y-2">
                      {title && <p className="font-semibold text-foreground">{title}</p>}
                      <ul className="space-y-2 ml-4">
                        {bullets.map((bullet, j) => (
                          <li key={j} className="text-foreground leading-relaxed">
                            {bullet.replace(/^[•\-]\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                }
                
                return (
                  <p key={i} className="text-foreground leading-relaxed">
                    {paragraph}
                  </p>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-purple-500/20">
              <Button
                variant="outline"
                onClick={() => {
                  setCollapsedRounds(new Set())
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="w-full"
              >
                View Full Debate
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* </CHANGE> */}

      {!hasSynthesis && currentRound < 3 && completedRounds.includes(currentRound) && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="ml-2">Preparing next round...</span>
        </div>
      )}
    </div>
  )
}
