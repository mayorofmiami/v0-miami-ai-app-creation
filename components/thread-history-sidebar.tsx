"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { Thread } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface ThreadHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onThreadSelect: (threadId: string) => void
  currentThreadId?: string | null
}

export function ThreadHistorySidebar({ isOpen, onClose, onThreadSelect, currentThreadId }: ThreadHistorySidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadThreads()
    }
  }, [isOpen])

  const loadThreads = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/threads")
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error("Failed to load threads:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("Delete this conversation?")) return

    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId))
        if (currentThreadId === threadId) {
          onThreadSelect("")
        }
      }
    } catch (error) {
      console.error("Failed to delete thread:", error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">History</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Thread List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-muted-foreground text-sm">No conversations yet</p>
              <p className="text-muted-foreground text-xs mt-2">Start searching to build your history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => {
                    onThreadSelect(thread.id)
                    onClose()
                  }}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all
                    hover:bg-accent/50 group
                    ${currentThreadId === thread.id ? "bg-accent border-primary" : "bg-card border-border"}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{thread.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    >
                      <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  )
}
