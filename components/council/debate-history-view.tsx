"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Search, Clock, MessageSquare, ExternalLink, Share2, RotateCcw } from "lucide-react"
import { CouncilLayout } from "@/components/council/council-layout"
import { logger } from "@/lib/logger"

interface Debate {
  id: string
  question: string
  status: string
  verdict: string | null
  created_at: string
  completed_at: string | null
  council_name: string | null
  council_type: string
  response_count: number
  responses?: any[]
  predictions?: any[]
}

interface User {
  id: string
  email: string
  name: string | null
  role?: string
}

export function DebateHistoryView() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [debates, setDebates] = useState<Debate[]>([])
  const [filteredDebates, setFilteredDebates] = useState<Debate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDebate, setSelectedDebate] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress">("all")

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/init")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        logger.error("Error loading user in debate history", { error })
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchDebates()
    }
  }, [user?.id])

  useEffect(() => {
    filterDebates()
  }, [debates, searchTerm, statusFilter])

  const fetchDebates = async () => {
    if (!user?.id) return

    try {
      const res = await fetch(`/api/council/debates?userId=${user.id}`)
      const data = await res.json()
      setDebates(data.debates || [])
    } catch (error) {
      logger.error("Error fetching debates", { error })
    } finally {
      setIsLoading(false)
    }
  }

  const filterDebates = () => {
    let filtered = debates

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.question.toLowerCase().includes(term) ||
          d.verdict?.toLowerCase().includes(term) ||
          d.council_name?.toLowerCase().includes(term),
      )
    }

    setFilteredDebates(filtered)
  }

  const viewDebateDetails = async (debateId: string) => {
    try {
      const res = await fetch(`/api/council/debates?userId=${user?.id}&debateId=${debateId}`)
      const data = await res.json()
      setSelectedDebate(data.debate)
      setIsDetailOpen(true)
    } catch (error) {
      logger.error("Error fetching debate details", { error })
    }
  }

  const rerunDebate = (debate: Debate) => {
    if (debate.council_name) {
      router.push(`/app/council/chat/${debate.id}?question=${encodeURIComponent(debate.question)}&rerun=true`)
    } else {
      router.push(`/app/council?question=${encodeURIComponent(debate.question)}`)
    }
  }

  const shareDebate = async (debateId: string) => {
    const shareUrl = `${window.location.origin}/council/shared/${debateId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert("Share link copied to clipboard!")
    } catch (error) {
      logger.error("Error copying debate link", { error })
    }
  }

  const getDebateDuration = (createdAt: string, completedAt: string | null) => {
    if (!completedAt) return "In progress"
    const start = new Date(createdAt).getTime()
    const end = new Date(completedAt).getTime()
    const minutes = Math.round((end - start) / 1000 / 60)
    return `${minutes} min`
  }

  return (
    <CouncilLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/council")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Debate History</h1>
            <p className="text-muted-foreground">Browse, search, and revisit your past Council debates</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3 mb-6 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search debates by question or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("in_progress")}
            >
              In Progress
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold">{debates.length}</div>
            <div className="text-sm text-muted-foreground">Total Debates</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{debates.filter((d) => d.status === "completed").length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{debates.reduce((sum, d) => sum + d.response_count, 0)}</div>
            <div className="text-sm text-muted-foreground">Total Responses</div>
          </Card>
        </div>

        {/* Debates List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredDebates.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{searchTerm ? "No debates found" : "No debates yet"}</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "Try adjusting your search or filters" : "Start your first Council debate to see it here"}
            </p>
            {!searchTerm && <Button onClick={() => router.push("/app/council")}>Start a Debate</Button>}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDebates.map((debate) => (
              <Card key={debate.id} className="p-6 hover:border-[var(--color-miami-aqua)]/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{debate.question}</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant={debate.status === "completed" ? "default" : "secondary"}>
                        {debate.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                      {debate.council_name && <Badge variant="outline">{debate.council_name}</Badge>}
                      <Badge variant="outline">{debate.council_type}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        {debate.response_count} responses
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {getDebateDuration(debate.created_at, debate.completed_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                    {new Date(debate.created_at).toLocaleDateString()}
                  </div>
                </div>

                {debate.verdict && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{debate.verdict}</p>}

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => viewDebateDetails(debate.id)} className="gap-2">
                    <ExternalLink className="w-3 h-3" />
                    View Full Debate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => rerunDebate(debate)} className="gap-2">
                    <RotateCcw className="w-3 h-3" />
                    Re-run
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => shareDebate(debate.id)} className="gap-2">
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Debate Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debate Details</DialogTitle>
            <DialogDescription>Full transcript and responses from this Council debate</DialogDescription>
          </DialogHeader>

          {selectedDebate && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Question</h3>
                <p className="text-muted-foreground">{selectedDebate.question}</p>
              </div>

              {selectedDebate.responses && selectedDebate.responses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Responses ({selectedDebate.responses.length})</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((round) => {
                      const roundResponses = selectedDebate.responses.filter((r: any) => r.round_number === round)
                      if (roundResponses.length === 0) return null

                      return (
                        <div key={round} className="space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground">Round {round}</h4>
                          {roundResponses.map((response: any, i: number) => (
                            <Card key={i} className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm">{response.advisor_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {response.model_used}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{response.content}</p>
                            </Card>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedDebate.verdict && (
                <div>
                  <h3 className="font-semibold mb-2">Final Verdict</h3>
                  <Card className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border-purple-500/20">
                    <p className="text-sm whitespace-pre-wrap">{selectedDebate.verdict}</p>
                  </Card>
                </div>
              )}

              {selectedDebate.predictions && selectedDebate.predictions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Predictions</h3>
                  <div className="space-y-2">
                    {selectedDebate.predictions.map((pred: any) => (
                      <Card key={pred.id} className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{pred.advisor_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {pred.confidence_score}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pred.prediction_text}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CouncilLayout>
  )
}
