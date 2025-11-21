"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { CouncilLayout } from "@/components/council/council-layout"
import { logger } from "@/lib/logger"

interface Advisor {
  name: string
  archetype: string
  icon: string
}

interface Response {
  advisor: string
  content: string
  round: number
}

interface User {
  id: string
  email: string
  name: string | null
}

export function CouncilDebateView({ councilId }: { councilId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [question, setQuestion] = useState(searchParams.get("question") || "")
  const [isDebating, setIsDebating] = useState(false)
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [currentRound, setCurrentRound] = useState<number>(0)
  const [currentAdvisor, setCurrentAdvisor] = useState<string>("")
  const [verdict, setVerdict] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set())
  const [votes, setVotes] = useState<Record<string, "agree" | "disagree">>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/init")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        logger.error("Error loading user in debate view", { error })
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [responses, verdict])

  const startDebate = async () => {
    if (!question.trim() || !user?.id) return

    setIsDebating(true)
    setResponses([])
    setVerdict("")
    setIsComplete(false)
    setCurrentRound(1)

    try {
      const res = await fetch("/api/council/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          councilId,
          question,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let buffer = ""
      let currentResponse = ""
      let currentResponseAdvisor = ""
      let currentResponseRound = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              setIsComplete(true)
              setIsDebating(false)
              break
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === "advisors") {
                setAdvisors(parsed.advisors)
              } else if (parsed.type === "round_start") {
                setCurrentRound(parsed.round)
                if (parsed.round > 1) {
                  setCollapsedRounds((prev) => new Set([...prev, parsed.round - 1]))
                }
              } else if (parsed.type === "advisor_start") {
                currentResponseAdvisor = parsed.advisor
                currentResponseRound = parsed.round
                currentResponse = ""
                setCurrentAdvisor(parsed.advisor)
              } else if (parsed.type === "text") {
                currentResponse += parsed.content
                setResponses((prev) => {
                  const existing = prev.find((r) => r.advisor === parsed.advisor && r.round === parsed.round)
                  if (existing) {
                    return prev.map((r) =>
                      r.advisor === parsed.advisor && r.round === parsed.round ? { ...r, content: currentResponse } : r,
                    )
                  }
                  return [
                    ...prev,
                    {
                      advisor: parsed.advisor,
                      content: currentResponse,
                      round: parsed.round,
                    },
                  ]
                })
              } else if (parsed.type === "advisor_end") {
                setCurrentAdvisor("")
              } else if (parsed.type === "verdict") {
                setVerdict((prev) => prev + parsed.content)
              }
            } catch (e) {
              logger.error("Failed to parse debate chunk", { error: e })
            }
          }
        }
      }
    } catch (error) {
      logger.error("Debate stream error", { error })
      setIsDebating(false)
    }
  }

  const toggleRound = (round: number) => {
    const newCollapsed = new Set(collapsedRounds)
    if (newCollapsed.has(round)) {
      newCollapsed.delete(round)
    } else {
      newCollapsed.add(round)
    }
    setCollapsedRounds(newCollapsed)
  }

  const handleVote = (advisor: string, round: number, voteType: "agree" | "disagree") => {
    const key = `${advisor}-${round}`
    setVotes((prev) => ({
      ...prev,
      [key]: prev[key] === voteType ? undefined : voteType,
    }))
  }

  const getRoundResponses = (round: number) => {
    return responses.filter((r) => r.round === round)
  }

  const getRoundTitle = (round: number) => {
    if (round === 1) return "Round 1: Opening Statements"
    if (round === 2) return "Round 2: Debate & Rebuttals"
    return "Round 3: Final Thoughts & Predictions"
  }

  return (
    <CouncilLayout>
      {isLoadingUser ? (
        <div className="flex flex-col min-h-[calc(100vh-8rem)]">
          <div className="border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 max-w-6xl">
              <div className="h-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 max-w-6xl">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/app/council")} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="flex-1">
                  <h1 className="text-xl font-bold">Council Debate</h1>
                  {advisors.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {advisors.map((advisor, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {advisor.icon} {advisor.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Debate Content */}
          <div className="flex-1 overflow-auto" ref={scrollRef}>
            <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
              {/* Progress */}
              {currentRound > 0 && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((round) => (
                    <button
                      key={round}
                      onClick={() => {
                        const element = document.getElementById(`round-${round}`)
                        element?.scrollIntoView({ behavior: "smooth" })
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        round <= currentRound
                          ? "bg-[var(--color-miami-aqua)] text-black"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {round <= currentRound ? "✓" : round}
                      <span className="hidden sm:inline">Round {round}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Rounds */}
              {[1, 2, 3].map((round) => {
                const roundResponses = getRoundResponses(round)
                if (roundResponses.length === 0 && round > currentRound) return null
                const isCollapsed = collapsedRounds.has(round)

                return (
                  <div key={round} id={`round-${round}`} className="space-y-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                      onClick={() => roundResponses.length > 0 && toggleRound(round)}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          round <= currentRound ? "bg-[var(--color-miami-aqua)] text-black" : "bg-muted"
                        } text-sm font-semibold`}
                      >
                        {round <= currentRound ? "✓" : round}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold">{getRoundTitle(round)}</h2>
                        {round === currentRound && !isComplete && (
                          <span className="text-sm text-muted-foreground animate-pulse">In progress...</span>
                        )}
                      </div>
                      {roundResponses.length > 0 && (
                        <Button variant="ghost" size="sm">
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>

                    {!isCollapsed && roundResponses.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {advisors.map((advisor) => {
                          const response = roundResponses.find((r) => r.advisor === advisor.name)
                          if (!response) return null

                          const voteKey = `${advisor.name}-${round}`
                          const vote = votes[voteKey]

                          return (
                            <Card key={advisor.name} className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{advisor.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm">{advisor.name}</h3>
                                </div>
                              </div>

                              <div className="prose prose-sm max-w-none mb-3">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{response.content}</p>
                              </div>

                              {round < 3 && (
                                <div className="flex gap-2">
                                  <Button
                                    variant={vote === "agree" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 h-8"
                                    onClick={() => handleVote(advisor.name, round, "agree")}
                                  >
                                    <ThumbsUp className="w-3 h-3 mr-1" />
                                    Agree
                                  </Button>
                                  <Button
                                    variant={vote === "disagree" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 h-8"
                                    onClick={() => handleVote(advisor.name, round, "disagree")}
                                  >
                                    <ThumbsDown className="w-3 h-3 mr-1" />
                                    Disagree
                                  </Button>
                                </div>
                              )}

                              {currentAdvisor === advisor.name && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="flex gap-1">
                                    <div
                                      className="w-2 h-2 bg-current rounded-full animate-bounce"
                                      style={{ animationDelay: "0ms" }}
                                    />
                                    <div
                                      className="w-2 h-2 bg-current rounded-full animate-bounce"
                                      style={{ animationDelay: "150ms" }}
                                    />
                                    <div
                                      className="w-2 h-2 bg-current rounded-full animate-bounce"
                                      style={{ animationDelay: "300ms" }}
                                    />
                                  </div>
                                  <span>Thinking...</span>
                                </div>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Verdict */}
              {verdict && (
                <Card className="p-6 border-2 border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
                  <div className="flex items-start gap-4 mb-4 pb-4 border-b border-purple-500/20">
                    <span className="text-3xl">⚖️</span>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">The Verdict</h3>
                      <p className="text-sm text-muted-foreground">Final recommendation from The Council</p>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{verdict}</p>
                  </div>

                  {isComplete && (
                    <div className="mt-6 pt-6 border-t border-purple-500/20">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCollapsedRounds(new Set())
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                        className="w-full"
                      >
                        View Full Debate
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Question Input (bottom) */}
          {!isDebating && responses.length === 0 && (
            <div className="border-t bg-background sticky bottom-0">
              <div className="container mx-auto px-4 py-4 max-w-6xl">
                <div className="flex gap-3">
                  <Input
                    placeholder="What decision do you need help with?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && startDebate()}
                    className="flex-1 h-12"
                  />
                  <Button
                    onClick={startDebate}
                    disabled={!question.trim() || isDebating}
                    size="lg"
                    className="bg-[var(--color-miami-aqua)] hover:bg-[var(--color-miami-aqua)]/90 text-black font-semibold gap-2 h-12 px-6"
                  >
                    <Send className="w-5 h-5" />
                    Start Debate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </CouncilLayout>
  )
}
