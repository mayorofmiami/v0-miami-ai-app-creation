"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Plus, Clock, Users, ArrowRight, Zap } from 'lucide-react'
import { CouncilLayout } from "@/components/council/council-layout"

interface Council {
  id: string
  name: string
  type: string
  uses_count: number
  updated_at: string
  advisorCount: number
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export function CouncilLandingView() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [quickQuestion, setQuickQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [councils, setCouncils] = useState<Council[]>([])
  const [loadingCouncils, setLoadingCouncils] = useState(true)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/init')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('[v0] Error loading user:', error)
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchCouncils()
    } else if (!loadingUser) {
      setLoadingCouncils(false)
    }
  }, [user?.id, loadingUser])

  const fetchCouncils = async () => {
    if (!user?.id) return
    
    try {
      const res = await fetch(`/api/council/councils?userId=${user.id}`)
      const data = await res.json()
      setCouncils(data.councils || [])
    } catch (error) {
      console.error('[v0] Error fetching councils:', error)
    } finally {
      setLoadingCouncils(false)
    }
  }

  const handleQuickCouncil = async () => {
    if (!quickQuestion.trim()) return
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/council/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          question: quickQuestion
        })
      })
      
      const data = await res.json()
      
      if (data.council) {
        router.push(`/council/chat/${data.council.id}?question=${encodeURIComponent(quickQuestion)}`)
      }
    } catch (error) {
      console.error('[v0] Error creating quick council:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const formData = new FormData()
      await fetch("/api/auth/logout", { method: "POST", body: formData })
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('[v0] Error logging out:', error)
    }
  }

  const getArchetypeIcon = (archetype: string) => {
    const icons: Record<string, string> = {
      visionary: '🚀',
      guardian: '🛡️',
      sage: '🧙',
      counselor: '💚',
      contrarian: '⚡',
      realist: '🎯',
      amplifier: '📈',
      builder: '🔧',
      executor: '⚙️',
      ethicist: '⚖️',
      historian: '📚',
      oracle: '🔮',
      artist: '🎨',
      craftsperson: '✨',
      critic: '🎭',
      mentor: '🌟',
      advocate: '🤝',
      optimist: '☀️',
      pessimist: '🌧️'
    }
    return icons[archetype] || '⭐'
  }

  return (
    <CouncilLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--color-miami-aqua)] to-[var(--color-miami-pink)] bg-clip-text text-transparent">
            The Council
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Summon your Council of AI advisors with custom personalities to debate important decisions
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/council/history')}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              View Past Debates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/council/predictions')}
              className="gap-2"
            >
              Track Predictions
            </Button>
          </div>
        </div>

        {/* Quick Council - Primary CTA */}
        <Card className="p-8 mb-12 border-2 border-[var(--color-miami-aqua)]/20 bg-gradient-to-br from-[var(--color-miami-aqua)]/5 to-[var(--color-miami-pink)]/5">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-full bg-[var(--color-miami-aqua)]/10">
              <Zap className="w-6 h-6 text-[var(--color-miami-aqua)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Quick Council</h2>
              <p className="text-muted-foreground">
                Ask a question, get instant wisdom from 3 AI advisors automatically selected for your topic
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-col sm:flex-row">
            <Input
              placeholder="Ask any question... (e.g., Should I raise my prices?)"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickCouncil()}
              className="flex-1 h-12 text-base"
              disabled={isLoading}
            />
            <Button 
              onClick={handleQuickCouncil}
              disabled={isLoading || !quickQuestion.trim()}
              size="lg"
              className="bg-[var(--color-miami-aqua)] hover:bg-[var(--color-miami-aqua)]/90 text-black font-semibold gap-2 h-12"
            >
              {isLoading ? 'Summoning...' : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Summon Council
                </>
              )}
            </Button>
          </div>

          {/* Example questions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {[
              "Should I raise prices?",
              "How do I handle burnout?",
              "Is this design too bold?"
            ].map((q) => (
              <button
                key={q}
                onClick={() => setQuickQuestion(q)}
                className="text-sm px-3 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <button
              onClick={() => router.push('/council/new')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              Or create a custom Council with your own advisor selection
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* Saved Councils */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Councils</h2>
            <Button
              onClick={() => router.push('/council/new')}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Custom Council
            </Button>
          </div>

          {loadingCouncils ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : councils.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Councils Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first Council to get started with personalized AI debates
              </p>
              <Button onClick={() => router.push('/council/new')} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Council
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {councils.map((council) => (
                <Card 
                  key={council.id}
                  className="p-6 hover:border-[var(--color-miami-aqua)]/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/council/chat/${council.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 group-hover:text-[var(--color-miami-aqua)] transition-colors">
                        {council.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {council.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Advisors */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-muted">
                      <Users className="w-4 h-4" />
                      <span>{council.advisorCount} advisor{council.advisorCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(council.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {council.uses_count} uses
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Preset Councils Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold">Preset Councils</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Startup Strategy",
                description: "Young, aggressive advisors for bold startup decisions",
                advisors: ["Visionary", "Amplifier", "Contrarian"],
                color: "purple"
              },
              {
                name: "Crisis Management",
                description: "Conservative, risk-averse advisors for critical situations",
                advisors: ["Guardian", "Realist", "Historian"],
                color: "red"
              },
              {
                name: "Life Decisions",
                description: "Empathetic, personal advisors for major life choices",
                advisors: ["Counselor", "Mentor", "Sage"],
                color: "green"
              }
            ].map((preset) => (
              <Card 
                key={preset.name}
                className="p-6 hover:border-[var(--color-miami-aqua)]/50 transition-colors cursor-pointer group border-dashed"
              >
                <h3 className="font-semibold mb-2 group-hover:text-[var(--color-miami-aqua)] transition-colors">
                  {preset.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {preset.description}
                </p>
                <div className="flex gap-2 flex-wrap text-xs">
                  {preset.advisors.map((advisor) => (
                    <Badge key={advisor} variant="secondary">
                      {advisor}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-4 gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Use Preset
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </CouncilLayout>
  )
}
