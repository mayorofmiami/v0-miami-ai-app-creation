"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Users, Sparkles, History, TrendingUp, Edit } from 'lucide-react'
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

  return (
    <CouncilLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-[var(--color-miami-aqua)] to-[var(--color-miami-pink)] bg-clip-text text-transparent">
            The Council
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl">
            Create and manage your custom AI advisory councils. Each council brings together multiple AI advisors with unique perspectives to help you make better decisions.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => router.push('/council/new')}
            size="lg"
            className="bg-[var(--color-miami-aqua)] hover:bg-[var(--color-miami-aqua)]/90 text-black font-semibold gap-2 h-14"
          >
            <Plus className="w-5 h-5" />
            Create New Council
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/council/history')}
            className="gap-2 h-14"
          >
            <History className="w-5 h-5" />
            View Past Debates
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/council/predictions')}
            className="gap-2 h-14"
          >
            <TrendingUp className="w-5 h-5" />
            Track Predictions
          </Button>
        </div>

        {/* Your Councils Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Councils</h2>
            <Badge variant="outline" className="text-sm">
              {councils.length} {councils.length === 1 ? 'Council' : 'Councils'}
            </Badge>
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
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Councils Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by creating your first custom council. Choose from preset templates or build your own from scratch.
              </p>
              <Button 
                onClick={() => router.push('/council/new')} 
                size="lg"
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Council
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {councils.map((council) => (
                <Card 
                  key={council.id}
                  className="p-6 hover:border-[var(--color-miami-aqua)]/50 transition-all duration-200 cursor-pointer group hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {council.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {council.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-muted">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{council.advisorCount}</span>
                      <span className="text-muted-foreground">advisor{council.advisorCount !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(council.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {council.uses_count} use{council.uses_count !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 mt-4"
                      onClick={() => router.push(`/council/edit/${council.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Council
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Preset Templates Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Preset Templates</h2>
            <p className="text-sm text-muted-foreground">
              Start with a pre-configured council, then customize it to your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Startup Strategy",
                description: "Bold, innovative advisors for rapid growth decisions",
                advisors: ["Visionary", "Amplifier", "Contrarian"],
                color: "from-purple-500/10 to-purple-600/10",
                border: "border-purple-500/20"
              },
              {
                name: "Crisis Management",
                description: "Conservative, cautious advisors for high-risk situations",
                advisors: ["Guardian", "Realist", "Historian"],
                color: "from-red-500/10 to-red-600/10",
                border: "border-red-500/20"
              },
              {
                name: "Life Decisions",
                description: "Empathetic, thoughtful advisors for personal choices",
                advisors: ["Counselor", "Mentor", "Sage"],
                color: "from-green-500/10 to-green-600/10",
                border: "border-green-500/20"
              }
            ].map((preset) => (
              <Card 
                key={preset.name}
                className={`p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 ${preset.border} bg-gradient-to-br ${preset.color}`}
                onClick={() => router.push('/council/new')}
              >
                <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--color-miami-aqua)] transition-colors">
                  {preset.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                  {preset.description}
                </p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {preset.advisors.map((advisor) => (
                    <Badge key={advisor} variant="secondary" className="text-xs">
                      {advisor}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full gap-2 group-hover:bg-background"
                >
                  <Plus className="w-4 h-4" />
                  Use Template
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </CouncilLayout>
  )
}
