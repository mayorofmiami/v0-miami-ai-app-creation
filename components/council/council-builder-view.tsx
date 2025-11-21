"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Plus, X, Sparkles } from "lucide-react"
import { CouncilLayout } from "@/components/council/council-layout"
import { logger } from "@/lib/logger"

interface Archetype {
  id: string
  archetype_key: string
  display_name: string
  description: string
  category: string
  default_icon: string
  rarity: string
  default_ethics: number
  default_risk: number
  default_time_horizon: number
  default_ideology: number
  default_experience: number
}

interface SelectedAdvisor {
  archetype: Archetype
  ethics: number
  risk: number
  timeHorizon: number
  ideology: number
  experience: number
  personalityPreset?: string
}

interface User {
  id: string
  email: string
  name: string | null
}

export function CouncilBuilderView() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [councilName, setCouncilName] = useState("")
  const [councilDescription, setCouncilDescription] = useState("")
  const [archetypes, setArchetypes] = useState<Archetype[]>([])
  const [selectedAdvisors, setSelectedAdvisors] = useState<SelectedAdvisor[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState("executive")

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/init")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        logger.error("Error loading user in council builder", { error })
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    fetchArchetypes()
  }, [])

  const fetchArchetypes = async () => {
    try {
      const res = await fetch("/api/council/archetypes")
      const data = await res.json()
      setArchetypes(data.archetypes || [])
    } catch (error) {
      logger.error("Error fetching archetypes", { error })
    }
  }

  const addAdvisor = (archetype: Archetype) => {
    if (selectedAdvisors.length >= 6) {
      alert("Maximum 6 advisors per council")
      return
    }

    const newAdvisor: SelectedAdvisor = {
      archetype,
      ethics: archetype.default_ethics,
      risk: archetype.default_risk,
      timeHorizon: archetype.default_time_horizon,
      ideology: archetype.default_ideology,
      experience: archetype.default_experience,
    }

    setSelectedAdvisors([...selectedAdvisors, newAdvisor])
    setEditingIndex(selectedAdvisors.length)
  }

  const removeAdvisor = (index: number) => {
    setSelectedAdvisors(selectedAdvisors.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
  }

  const updateAdvisor = (index: number, updates: Partial<SelectedAdvisor>) => {
    const updated = [...selectedAdvisors]
    updated[index] = { ...updated[index], ...updates }
    setSelectedAdvisors(updated)
  }

  const createCouncil = async () => {
    if (!councilName.trim() || selectedAdvisors.length < 3 || !user?.id) {
      alert("Please name your council and select at least 3 advisors")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/council/councils", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: councilName,
          description: councilDescription,
          type: "custom",
          advisors: selectedAdvisors.map((advisor) => ({
            archetype: advisor.archetype.archetype_key,
            ethics: advisor.ethics,
            risk: advisor.risk,
            timeHorizon: advisor.timeHorizon,
            ideology: advisor.ideology,
            experience: advisor.experience,
            personalityPreset: advisor.personalityPreset,
          })),
        }),
      })

      const data = await res.json()

      if (data.council) {
        router.push(`/app/council/chat/${data.council.id}`)
      }
    } catch (error) {
      logger.error("Error creating council", { error })
    } finally {
      setIsLoading(false)
    }
  }

  const categorizedArchetypes = archetypes.reduce(
    (acc, archetype) => {
      if (!acc[archetype.category]) acc[archetype.category] = []
      acc[archetype.category].push(archetype)
      return acc
    },
    {} as Record<string, Archetype[]>,
  )

  const getSliderLabel = (slider: string, value: number) => {
    const labels: Record<string, Record<string, string>> = {
      ethics: {
        low: "Ruthless",
        mid: "Pragmatic",
        high: "Principled",
      },
      risk: {
        low: "Conservative",
        mid: "Moderate",
        high: "Aggressive",
      },
      timeHorizon: {
        low: "Immediate",
        mid: "Medium-term",
        high: "Long-term",
      },
      ideology: {
        low: "Progressive",
        mid: "Centrist",
        high: "Conservative",
      },
      experience: {
        low: "Rookie",
        mid: "Veteran",
        high: "Legend",
      },
    }

    const range = value < 33 ? "low" : value < 67 ? "mid" : "high"
    return labels[slider]?.[range] || ""
  }

  return (
    <CouncilLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/council")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Create Custom Council</h1>
            <p className="text-muted-foreground">Select advisors and customize their personalities with sliders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Advisor Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select Advisors ({selectedAdvisors.length}/6)</h2>

              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="executive">Executive</TabsTrigger>
                  <TabsTrigger value="wisdom">Wisdom</TabsTrigger>
                  <TabsTrigger value="creative">Creative</TabsTrigger>
                  <TabsTrigger value="life">Life</TabsTrigger>
                  <TabsTrigger value="wild_card">Wild Cards</TabsTrigger>
                </TabsList>

                {Object.entries(categorizedArchetypes).map(([category, archetypeList]) => (
                  <TabsContent key={category} value={category} className="mt-4 space-y-3">
                    {archetypeList.map((archetype) => {
                      const isSelected = selectedAdvisors.some((a) => a.archetype.id === archetype.id)

                      return (
                        <Card
                          key={archetype.id}
                          className={`p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[var(--color-miami-aqua)] bg-[var(--color-miami-aqua)]/5"
                              : "hover:border-[var(--color-miami-aqua)]/50"
                          }`}
                          onClick={() => !isSelected && addAdvisor(archetype)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{archetype.default_icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{archetype.display_name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {archetype.rarity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{archetype.description}</p>
                            </div>
                            {isSelected && (
                              <Badge variant="default" className="bg-[var(--color-miami-aqua)] text-black">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>

          {/* Right: Selected Advisors & Sliders */}
          <div className="space-y-6">
            {/* Council Details */}
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Council Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Startup Strategy Council"
                  value={councilName}
                  onChange={(e) => setCouncilName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Describe your council's purpose"
                  value={councilDescription}
                  onChange={(e) => setCouncilDescription(e.target.value)}
                  className="mt-2"
                />
              </div>
            </Card>

            {/* Selected Advisors */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Your Council</h3>

              {selectedAdvisors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select advisors from the left</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAdvisors.map((advisor, index) => (
                    <Card
                      key={index}
                      className={`p-4 ${editingIndex === index ? "border-[var(--color-miami-aqua)]" : ""}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl">{advisor.archetype.default_icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{advisor.archetype.display_name}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          className="h-8 px-2"
                        >
                          {editingIndex === index ? "Done" : "Edit"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdvisor(index)}
                          className="h-8 px-2 text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {editingIndex === index && (
                        <div className="space-y-4 mt-4 pt-4 border-t">
                          {/* Ethics Slider */}
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Ethics</span>
                              <span className="font-medium">{getSliderLabel("ethics", advisor.ethics)}</span>
                            </div>
                            <Slider
                              value={[advisor.ethics]}
                              onValueChange={([v]) => updateAdvisor(index, { ethics: v })}
                              max={100}
                              step={1}
                              className="mb-1"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Ruthless</span>
                              <span>Principled</span>
                            </div>
                          </div>

                          {/* Risk Slider */}
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Risk Tolerance</span>
                              <span className="font-medium">{getSliderLabel("risk", advisor.risk)}</span>
                            </div>
                            <Slider
                              value={[advisor.risk]}
                              onValueChange={([v]) => updateAdvisor(index, { risk: v })}
                              max={100}
                              step={1}
                              className="mb-1"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Conservative</span>
                              <span>Aggressive</span>
                            </div>
                          </div>

                          {/* Time Horizon Slider */}
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Time Horizon</span>
                              <span className="font-medium">{getSliderLabel("timeHorizon", advisor.timeHorizon)}</span>
                            </div>
                            <Slider
                              value={[advisor.timeHorizon]}
                              onValueChange={([v]) => updateAdvisor(index, { timeHorizon: v })}
                              max={100}
                              step={1}
                              className="mb-1"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Immediate</span>
                              <span>Long-term</span>
                            </div>
                          </div>

                          {/* Ideology Slider */}
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Ideology</span>
                              <span className="font-medium">{getSliderLabel("ideology", advisor.ideology)}</span>
                            </div>
                            <Slider
                              value={[advisor.ideology]}
                              onValueChange={([v]) => updateAdvisor(index, { ideology: v })}
                              max={100}
                              step={1}
                              className="mb-1"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progressive</span>
                              <span>Conservative</span>
                            </div>
                          </div>

                          {/* Experience Slider */}
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Experience</span>
                              <span className="font-medium">{getSliderLabel("experience", advisor.experience)}</span>
                            </div>
                            <Slider
                              value={[advisor.experience]}
                              onValueChange={([v]) => updateAdvisor(index, { experience: v })}
                              max={100}
                              step={1}
                              className="mb-1"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Rookie</span>
                              <span>Legend</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Summon Button */}
            <Button
              onClick={createCouncil}
              disabled={isLoading || selectedAdvisors.length < 3 || !councilName.trim()}
              className="w-full bg-gradient-to-r from-[var(--color-miami-aqua)] to-[var(--color-miami-pink)] text-black font-semibold h-12 gap-2"
            >
              {isLoading ? (
                "Summoning..."
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Summon Council
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </CouncilLayout>
  )
}
