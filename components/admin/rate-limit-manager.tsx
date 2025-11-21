"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface RateLimitConfig {
  id: string
  config_key: string
  config_type: "global" | "model" | "feature"
  max_requests: number
  window_seconds: number
  applies_to: "all" | "free" | "authenticated" | "pro"
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function RateLimitManager() {
  const [configs, setConfigs] = useState<RateLimitConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<RateLimitConfig | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/admin/rate-limits")
      const data = await res.json()
      setConfigs(data.configs || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch rate limit configs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateConfig(config: Partial<RateLimitConfig> & { id: string }) {
    try {
      const res = await fetch("/api/admin/rate-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!res.ok) throw new Error("Failed to update")

      toast({
        title: "Success",
        description: "Rate limit updated successfully",
      })

      fetchConfigs()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rate limit",
        variant: "destructive",
      })
    }
  }

  async function toggleActive(id: string, is_active: boolean) {
    await updateConfig({ id, is_active })
  }

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  function getTypeColor(type: string) {
    switch (type) {
      case "global":
        return "bg-blue-500/10 text-blue-500"
      case "model":
        return "bg-purple-500/10 text-purple-500"
      case "feature":
        return "bg-green-500/10 text-green-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  function getTierColor(tier: string) {
    switch (tier) {
      case "free":
        return "bg-gray-500/10 text-gray-500"
      case "authenticated":
        return "bg-blue-500/10 text-blue-500"
      case "pro":
        return "bg-amber-500/10 text-amber-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Limit Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure rate limits for different user tiers, models, and features
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Limit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Rate Limit</DialogTitle>
              <DialogDescription>Add a new rate limit configuration</DialogDescription>
            </DialogHeader>
            {/* Add form here */}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-mono text-sm">{config.config_key}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(config.config_type)}>{config.config_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getTierColor(config.applies_to)}>{config.applies_to}</Badge>
                </TableCell>
                <TableCell className="font-semibold">{config.max_requests}</TableCell>
                <TableCell>{formatTime(config.window_seconds)}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{config.description || "—"}</TableCell>
                <TableCell>
                  <Switch checked={config.is_active} onCheckedChange={(checked) => toggleActive(config.id, checked)} />
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setEditingConfig(config)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      {editingConfig && (
        <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rate Limit</DialogTitle>
              <DialogDescription>{editingConfig.config_key}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Max Requests</Label>
                <Input
                  type="number"
                  value={editingConfig.max_requests}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, max_requests: Number.parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Window (seconds)</Label>
                <Input
                  type="number"
                  value={editingConfig.window_seconds}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, window_seconds: Number.parseInt(e.target.value) })
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Current: {formatTime(editingConfig.window_seconds)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingConfig.is_active}
                  onCheckedChange={(checked) => setEditingConfig({ ...editingConfig, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <Button
                onClick={() => {
                  updateConfig(editingConfig)
                  setEditingConfig(null)
                }}
                className="w-full"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
