"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Folder, Trash2 } from "lucide-react"
import { toast } from "@/lib/toast"
import type { Collection } from "@/lib/collections"

interface CollectionsModalProps {
  open: boolean
  onClose: () => void
  userId: string
  searchId?: string
}

export function CollectionsModal({ open, onClose, userId, searchId }: CollectionsModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadCollections()
    }
  }, [open, userId])

  const loadCollections = async () => {
    try {
      const res = await fetch(`/api/collections?userId=${userId}`)
      const data = await res.json()
      setCollections(data.collections || [])
    } catch (error) {
      console.error("[v0] Failed to load collections:", error)
      toast.error("Failed to load collections")
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a collection name")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: newName, description: newDescription }),
      })

      if (!res.ok) throw new Error("Failed to create collection")

      toast.success("Collection created")
      setNewName("")
      setNewDescription("")
      setIsCreating(false)
      loadCollections()
    } catch (error) {
      console.error("[v0] Failed to create collection:", error)
      toast.error("Failed to create collection")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCollection = async (collectionId: string) => {
    if (!searchId) return

    setLoading(true)
    try {
      const res = await fetch("/api/collections/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, searchId }),
      })

      if (!res.ok) throw new Error("Failed to add to collection")

      toast.success("Added to collection")
      onClose()
    } catch (error) {
      console.error("[v0] Failed to add to collection:", error)
      toast.error("Failed to add to collection")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/collections?collectionId=${collectionId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete collection")

      toast.success("Collection deleted")
      loadCollections()
    } catch (error) {
      console.error("[v0] Failed to delete collection:", error)
      toast.error("Failed to delete collection")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collections</DialogTitle>
          <DialogDescription>Organize your searches into collections</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isCreating ? (
            <>
              <Button onClick={() => setIsCreating(true)} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Collection
              </Button>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {collections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No collections yet</p>
                ) : (
                  collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Folder className="w-5 h-5 text-miami-aqua" />
                        <div className="flex-1">
                          <p className="font-medium">{collection.name}</p>
                          {collection.description && (
                            <p className="text-sm text-muted-foreground">{collection.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{collection.search_count || 0} searches</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {searchId && (
                          <Button
                            size="sm"
                            onClick={() => handleAddToCollection(collection.id)}
                            disabled={loading}
                            className="bg-gradient-to-r from-miami-pink to-miami-blue hover:opacity-90"
                          >
                            Add
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(collection.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <Textarea
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={loading} className="flex-1">
                  Create
                </Button>
                <Button onClick={() => setIsCreating(false)} variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
