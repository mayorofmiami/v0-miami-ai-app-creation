"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Sparkles, History, ArrowRight, Zap, Shield, Heart } from "lucide-react"
import { CouncilLayout } from "@/components/council/council-layout"
import { cn } from "@/lib/utils"

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
        const res = await fetch("/api/init")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error("[v0] Error loading user:", error)
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
      console.error("[v0] Error fetching councils:", error)
    } finally {
      setLoadingCouncils(false)
    }
  }

  return (
    <CouncilLayout>
      <div className="relative min-h-screen">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-miami-aqua)]/20 via-background to-background pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-miami-aqua)]/10 border border-[var(--color-miami-aqua)]/20 text-[var(--color-miami-aqua)] text-sm font-medium mb-4 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>AI Advisory Board</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                The
              </span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-miami-aqua)] to-[var(--color-miami-pink)] neon-glow">
                Council
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Assemble your personal board of AI advisors. Combine unique perspectives to make better decisions, solve
              complex problems, and see the future.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => router.push("/council/new")}
                size="lg"
                className="bg-[var(--color-miami-aqua)] hover:bg-[var(--color-miami-aqua)]/90 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_20px_rgba(2,216,233,0.3)] hover:shadow-[0_0_30px_rgba(2,216,233,0.5)] transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Summon New Council
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/council/history")}
                className="h-12 px-8 rounded-full border-white/10 hover:bg-white/5 hover:border-[var(--color-miami-pink)]/50 transition-all duration-300"
              >
                <History className="w-5 h-5 mr-2" />
                Past Debates
              </Button>
            </div>
          </div>

          {/* Your Councils Section */}
          <div className="mb-20">
            <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Councils</h2>
                <p className="text-muted-foreground text-sm">Manage your active advisory boards</p>
              </div>
              <Badge variant="secondary" className="bg-white/5 text-white border-white/10">
                {councils.length} Active
              </Badge>
            </div>

            {loadingCouncils ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-[200px] bg-white/5 border-white/10 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : councils.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-white/10 bg-white/5 rounded-3xl backdrop-blur-sm">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-miami-aqua)]/10 flex items-center justify-center">
                  <Users className="w-10 h-10 text-[var(--color-miami-aqua)]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Councils Summoned</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  You haven't created any councils yet. Start by assembling your first team of AI advisors.
                </p>
                <Button
                  onClick={() => router.push("/council/new")}
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 rounded-full font-semibold"
                >
                  Create First Council
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {councils.map((council) => (
                  <Card
                    key={council.id}
                    className="group relative overflow-hidden bg-black/40 border-white/10 hover:border-[var(--color-miami-aqua)]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(2,216,233,0.1)] rounded-2xl backdrop-blur-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-miami-aqua)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="p-6 relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-miami-aqua)]/20 to-[var(--color-miami-aqua)]/5 flex items-center justify-center border border-[var(--color-miami-aqua)]/20 group-hover:scale-110 transition-transform duration-500">
                          <Users className="w-6 h-6 text-[var(--color-miami-aqua)]" />
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-black/50 border-white/10 text-xs uppercase tracking-wider"
                        >
                          {council.type}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--color-miami-aqua)] transition-colors">
                        {council.name}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{council.advisorCount} Advisors</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          <span>{council.uses_count} Uses</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-xs text-muted-foreground">
                          Updated {new Date(council.updated_at).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--color-miami-aqua)] hover:text-[var(--color-miami-aqua)] hover:bg-[var(--color-miami-aqua)]/10 -mr-2"
                          onClick={() => router.push(`/council/edit/${council.id}`)}
                        >
                          Manage <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Templates Section */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Starter Templates</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Don't know where to start? Choose a pre-configured council template designed for specific
                decision-making scenarios.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Startup Strategy",
                  description: "Bold, innovative advisors for rapid growth and disruption.",
                  icon: Zap,
                  color: "var(--color-miami-purple)",
                  gradient: "from-purple-500/20 to-blue-500/5",
                  border: "group-hover:border-purple-500/50",
                },
                {
                  name: "Crisis Management",
                  description: "Conservative, experienced advisors for navigating risks.",
                  icon: Shield,
                  color: "var(--color-miami-orange)",
                  gradient: "from-orange-500/20 to-red-500/5",
                  border: "group-hover:border-orange-500/50",
                },
                {
                  name: "Personal Growth",
                  description: "Empathetic, wise advisors for life decisions and balance.",
                  icon: Heart,
                  color: "var(--color-miami-green)",
                  gradient: "from-green-500/20 to-emerald-500/5",
                  border: "group-hover:border-green-500/50",
                },
              ].map((template) => (
                <Card
                  key={template.name}
                  className={cn(
                    "group relative overflow-hidden bg-black/40 border-white/10 transition-all duration-500 hover:-translate-y-1 cursor-pointer rounded-2xl backdrop-blur-md",
                    template.border,
                  )}
                  onClick={() => router.push("/council/new")}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="p-8 relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <template.icon className="w-7 h-7" style={{ color: template.color }} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors">
                      {template.name}
                    </h3>

                    <p className="text-muted-foreground mb-8 flex-grow leading-relaxed">{template.description}</p>

                    <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 group-hover:border-white/20">
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CouncilLayout>
  )
}
