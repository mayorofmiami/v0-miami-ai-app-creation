"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Council {
  id: string
  name: string
  description: string
  type: string
  uses_count: number
  advisorCount?: number
}

interface CouncilSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCouncil: (councilId: string | 'quick') => void
  userId: string
}

export function CouncilSelectorDialog({ open, onOpenChange, onSelectCouncil, userId }: CouncilSelectorDialogProps) {
  const router = useRouter()
  const [councils, setCouncils] = useState<Council[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && userId) {
      fetchCouncils()
    }
  }, [open, userId])

  const fetchCouncils = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/council/councils?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setCouncils(data.councils || [])
      }
    } catch (error) {
      console.error("Failed to fetch councils:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCouncil = () => {
    onSelectCouncil('quick')
    onOpenChange(false)
  }

  const handleSelectCouncil = (councilId: string) => {
    onSelectCouncil(councilId)
    onOpenChange(false)
  }

  const handleCreateNew = () => {
    router.push('/council')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🏛️</span>
            Select Your Council
          </DialogTitle>
          <DialogDescription>
            Choose a saved council or start a quick debate with default advisors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Quick Council Option */}
          <Card
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 border-purple-500/20"
            onClick={handleQuickCouncil}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Quick Council</h3>
                <p className="text-sm text-muted-foreground">
                  Start a debate with 5 balanced advisors (Visionary, Guardian, Sage, Contrarian, Realist)
                </p>
              </div>
            </div>
          </Card>

          {/* Create New Council Option */}
          <Card
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed"
            onClick={handleCreateNew}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Plus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Create Custom Council</h3>
                <p className="text-sm text-muted-foreground">
                  Build a new council with custom advisors and personality settings
                </p>
              </div>
            </div>
          </Card>

          {/* Saved Councils */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading your councils...
            </div>
          ) : councils.length > 0 ? (
            <>
              <div className="flex items-center gap-2 pt-4">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-muted-foreground">Your Saved Councils</h3>
              </div>
              <div className="space-y-2">
                {councils.map((council) => (
                  <Card
                    key={council.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelectCouncil(council.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{council.name}</h3>
                          {council.type === 'preset' && (
                            <Badge variant="secondary" className="text-xs">Preset</Badge>
                          )}
                        </div>
                        {council.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{council.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {council.advisorCount && (
                            <span>{council.advisorCount} advisors</span>
                          )}
                          <span>Used {council.uses_count} times</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No saved councils yet</p>
              <p className="text-sm mt-1">Create your first custom council to get started</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
