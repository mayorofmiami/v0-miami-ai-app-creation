"use client"

import { useEffect, useState, useCallback } from "react"
import X from "@/components/icons/X"
import BookmarkIcon from "@/components/icons/Bookmark"
import SearchIcon from "@/components/icons/SearchIcon"
import ChevronLeft from "@/components/icons/ChevronLeft"
import ChevronRight from "@/components/icons/ChevronRight"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Bookmark {
  id: string
  query: string
  response: string
  created_at: string
  bookmarked_at: string
}

interface BookmarksSidebarProps {
  userId: string | null
  onClose: () => void
  onSelectBookmark: (query: string) => void
  isOpen: boolean
}

export function BookmarksSidebar({ userId, onClose, onSelectBookmark, isOpen }: BookmarksSidebarProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isOpen || !userId) return

    async function fetchBookmarks() {
      setIsLoading(true)
      try {
        const res = await fetch("/api/bookmarks")
        const data = await res.json()
        setBookmarks(data.bookmarks || [])
        setFilteredBookmarks(data.bookmarks || [])
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookmarks()
  }, [userId, isOpen])

  useEffect(() => {
    if (searchFilter.trim()) {
      const filtered = bookmarks.filter((item) => item.query.toLowerCase().includes(searchFilter.toLowerCase()))
      setFilteredBookmarks(filtered)
      setCurrentPage(1)
    } else {
      setFilteredBookmarks(bookmarks)
    }
  }, [searchFilter, bookmarks])

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

  const handleSelectBookmark = useCallback(
    (query: string) => {
      onSelectBookmark(query)
      onClose()
    },
    [onSelectBookmark, onClose],
  )

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    const totalPages = Math.ceil(filteredBookmarks.length / itemsPerPage)
    setCurrentPage((p) => Math.min(totalPages, p + 1))
  }, [filteredBookmarks.length, itemsPerPage])

  const totalPages = Math.ceil(filteredBookmarks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredBookmarks.slice(startIndex, endIndex)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
      <div className="w-full max-w-md bg-background border-r border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookmarkIcon className="w-5 h-5 text-miami-aqua fill-current" />
              <h2 className="text-lg font-bold">Bookmarks</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Input
            type="text"
            placeholder="Filter bookmarks..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading bookmarks...</div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookmarkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchFilter ? "No matching bookmarks" : "No bookmarks yet"}</p>
              <p className="text-sm mt-2">
                {searchFilter ? "Try a different filter" : "Bookmark responses to save them here"}
              </p>
            </div>
          ) : (
            currentItems.map((bookmark) => (
              <button
                key={bookmark.id}
                onClick={() => handleSelectBookmark(bookmark.query)}
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-miami-aqua/50 transition-all group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <SearchIcon className="w-4 h-4 text-miami-aqua flex-shrink-0 mt-0.5" />
                  <p className="font-medium text-foreground group-hover:text-miami-aqua transition-colors line-clamp-2 text-pretty">
                    {bookmark.query}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(bookmark.bookmarked_at || bookmark.created_at)}</span>
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
