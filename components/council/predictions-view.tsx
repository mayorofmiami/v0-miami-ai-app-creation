"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { CouncilLayout } from "@/components/council/council-layout"

interface Prediction {
  id: string
  advisor_archetype: string
  advisor_name: string
  prediction_text: string
  confidence_score: number
  due_date: string
  outcome: "pending" | "correct" | "incorrect" | "partial"
  created_at: string
}

interface User {
  id: string
  email: string
  name: string | null
}

export function PredictionsView() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/init")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error("[v0] Error loading user:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchPredictions()
    }
  }, [user?.id])

  const fetchPredictions = async () => {
    if (!user?.id) return

    try {
      const res = await fetch(`/api/council/predictions?userId=${user.id}&status=all`)
      const data = await res.json()
      setPredictions(data.predictions || [])
    } catch (error) {
      console.error("[v0] Error fetching predictions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysUntil = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "correct":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "incorrect":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "partial":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-blue-500" />
    }
  }

  const pendingPredictions = predictions.filter((p) => p.outcome === "pending")
  const completedPredictions = predictions.filter((p) => p.outcome !== "pending")

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
            <h1 className="text-3xl font-bold">Predictions</h1>
            <p className="text-muted-foreground">Track your Council's predictions and verify outcomes</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Predictions Yet</h3>
            <p className="text-muted-foreground mb-6">Start a Council debate to generate predictions</p>
            <Button onClick={() => router.push("/app/council")}>Go to Council</Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Pending Predictions */}
            {pendingPredictions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Predictions ({pendingPredictions.length})</h2>
                <div className="space-y-3">
                  {pendingPredictions.map((prediction) => {
                    const daysUntil = getDaysUntil(prediction.due_date)
                    const isOverdue = daysUntil < 0

                    return (
                      <Card key={prediction.id} className={`p-6 ${isOverdue ? "border-red-500/50" : ""}`}>
                        <div className="flex items-start gap-4">
                          {getOutcomeIcon(prediction.outcome)}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold mb-1">{prediction.advisor_name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {prediction.confidence_score}% confidence
                                </Badge>
                              </div>
                              <Badge variant={isOverdue ? "destructive" : "secondary"}>
                                {isOverdue ? "Overdue" : `${daysUntil} days`}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{prediction.prediction_text}</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Mark Correct
                              </Button>
                              <Button size="sm" variant="outline">
                                Mark Incorrect
                              </Button>
                              <Button size="sm" variant="outline">
                                Partially Correct
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed Predictions */}
            {completedPredictions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Verified Predictions ({completedPredictions.length})</h2>
                <div className="space-y-3">
                  {completedPredictions.map((prediction) => (
                    <Card key={prediction.id} className="p-6 opacity-75">
                      <div className="flex items-start gap-4">
                        {getOutcomeIcon(prediction.outcome)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold mb-1">{prediction.advisor_name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {prediction.confidence_score}% confidence
                              </Badge>
                            </div>
                            <Badge
                              variant={
                                prediction.outcome === "correct"
                                  ? "default"
                                  : prediction.outcome === "incorrect"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {prediction.outcome}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{prediction.prediction_text}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CouncilLayout>
  )
}
