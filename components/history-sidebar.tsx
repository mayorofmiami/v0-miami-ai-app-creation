"use client"

import { useEffect, useState } from "react"
import { X, Clock, Sparkles, SearchIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SearchHistory } from "@/lib/db"

interface HistorySidebarProps {
  userId: string | null
  onClose: () => void
  onSelectHistory: (history: SearchHistory) => void
  localSearches?: string[]
}

export function HistorySidebar({ userId, onClose, onSelectHistory, localSearches = [] }: HistorySidebarProps) {
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [filteredHistory, setFilteredHistory] = useState<SearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    async function fetchHistory() {
      if (!userId) {
        const localHistory: SearchHistory[] = localSearches.map((query, index) => ({
          id: `local-${index}`,
          user_id: "local",
          query,
          mode: "quick" as const,
          response: "",
          citations: [],
          created_at: new Date().toISOString(),
        }))
        setHistory(localHistory)
        setFilteredHistory(localHistory)
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/history?userId=${userId}`)
        const data = await res.json()
        setHistory(data.history || [])
        setFilteredHistory(data.history || [])
      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [userId, localSearches])

  useEffect(() => {
    if (searchFilter.trim()) {
      const filtered = history.filter((item) => item.query.toLowerCase().includes(searchFilter.toLowerCase()))
      setFilteredHistory(filtered)
      setCurrentPage(1)
    } else {
      setFilteredHistory(history)
    }
  }, [searchFilter, history])

  const formatDate = (dateString: string) => {
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
  }

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredHistory.slice(startIndex, endIndex)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
      <div className="w-full max-w-md bg-background border-r border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-miami-aqua" />
              <h2 className="text-lg font-bold">Search History</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Input
            type="text"
            placeholder="Filter history..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading history...</div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchFilter ? "No matching searches" : "No search history yet"}</p>
              <p className="text-sm mt-2">
                {searchFilter ? "Try a different filter" : "Your searches will appear here"}
              </p>
            </div>
          ) : (
            currentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectHistory(item)
                  onClose()
                }}
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-miami-aqua/50 transition-all group"
              >
                <div className="flex items-start gap-2 mb-2">
                  {item.mode === "deep" ? (
                    <Sparkles className="w-4 h-4 text-miami-pink flex-shrink-0 mt-0.5" />
                  ) : (
                    <SearchIcon className="w-4 h-4 text-miami-aqua flex-shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-foreground group-hover:text-miami-aqua transition-colors line-clamp-2 text-pretty">
                    {item.query}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(item.created_at)}</span>
                  <span className="capitalize">{item.mode}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
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
