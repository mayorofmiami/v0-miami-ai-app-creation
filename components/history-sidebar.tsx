"use client"

import type React from "react"

// Version: 2.0 - Simplified UI without dates or message counts

import { useEffect, useState, useCallback } from "react"
import X from "@/components/icons/X"
import Clock from "@/components/icons/Clock"
import SearchIcon from "@/components/icons/SearchIcon"
import ChevronLeft from "@/components/icons/ChevronLeft"
import ChevronRight from "@/components/icons/ChevronRight"
import Trash2 from "@/components/icons/Trash2"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Thread {
  id: string
  title: string
}

interface HistorySidebarProps {
  userId: string | null
  onClose: () => void
  onSelectThread: (threadId: string) => void
  localThreads?: Thread[]
  isOpen: boolean
}

export function HistorySidebar({ userId, onClose, onSelectThread, localThreads = [], isOpen }: HistorySidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isOpen) return

    async function fetchThreads() {
      if (!userId) {
        setThreads(localThreads)
        setFilteredThreads(localThreads)
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/threads?userId=${userId}`)
        const data = await res.json()
        setThreads(data.threads || [])
        setFilteredThreads(data.threads || [])
      } catch (error) {
        console.error("Failed to fetch threads:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchThreads()
  }, [userId, localThreads, isOpen])

  useEffect(() => {
    if (searchFilter.trim()) {
      const filtered = threads.filter((item) => item.title.toLowerCase().includes(searchFilter.toLowerCase()))
      setFilteredThreads(filtered)
      setCurrentPage(1)
    } else {
      setFilteredThreads(threads)
    }
  }, [searchFilter, threads])

  const handleSelectThread = useCallback(
    (threadId: string) => {
      onSelectThread(threadId)
      onClose()
    },
    [onSelectThread, onClose],
  )

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1))
  }, [])

  const handleDelete = useCallback(async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation() // Prevent thread selection when clicking delete

    if (!confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
      return
    }

    setDeletingId(threadId)

    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        // Remove from local state
        setThreads((prev) => prev.filter((t) => t.id !== threadId))
        setFilteredThreads((prev) => prev.filter((t) => t.id !== threadId))
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete conversation")
      }
    } catch (error) {
      console.error("Failed to delete thread:", error)
      alert("Failed to delete conversation")
    } finally {
      setDeletingId(null)
    }
  }, [])

  const totalPages = Math.ceil(filteredThreads.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredThreads.slice(startIndex, endIndex)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
      <div className="w-full max-w-md bg-background border-r border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-miami-aqua" />
              <h2 className="text-lg font-bold">Recent Chats</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Input
            type="text"
            placeholder="Filter conversations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading conversations...</div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchFilter ? "No matching conversations" : "No conversations yet"}</p>
              <p className="text-sm mt-2">
                {searchFilter ? "Try a different filter" : "Your conversations will appear here"}
              </p>
            </div>
          ) : (
            currentItems.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread.id)}
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-miami-aqua/50 transition-all group relative"
              >
                <div className="flex items-start gap-2">
                  <SearchIcon className="w-4 h-4 text-miami-aqua flex-shrink-0 mt-0.5" />
                  <p className="font-medium text-foreground group-hover:text-miami-aqua transition-colors line-clamp-2 text-pretty flex-1">
                    {thread.title}
                  </p>
                  {userId && (
                    <button
                      onClick={(e) => handleDelete(e, thread.id)}
                      disabled={deletingId === thread.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity disabled:opacity-50"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />
    </div>
  )
}
