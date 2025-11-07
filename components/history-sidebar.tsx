"use client"

import { useEffect, useState, useCallback } from "react"
import X from "@/components/icons/X"
import Clock from "@/components/icons/Clock"
import SearchIcon from "@/components/icons/SearchIcon"
import ChevronLeft from "@/components/icons/ChevronLeft"
import ChevronRight from "@/components/icons/ChevronRight"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Thread {
  id: string
  title: string
  message_count: number
  updated_at: string
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

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }, [])

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
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-miami-aqua/50 transition-all group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <SearchIcon className="w-4 h-4 text-miami-aqua flex-shrink-0 mt-0.5" />
                  <p className="font-medium text-foreground group-hover:text-miami-aqua transition-colors line-clamp-2 text-pretty">
                    {thread.title}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(thread.updated_at)}</span>
                  <span>
                    {thread.message_count} message{thread.message_count !== 1 ? "s" : ""}
                  </span>
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
