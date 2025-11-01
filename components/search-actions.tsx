"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Share2 from "@/components/icons/Share2"
import Download from "@/components/icons/Download"
import Bookmark from "@/components/icons/Bookmark"
import Check from "@/components/icons/Check"
import MoreVertical from "@/components/icons/MoreVertical"
import { exportToMarkdown, downloadMarkdown, exportToText, downloadText } from "@/lib/export"
import { toast } from "@/lib/toast"

interface SearchActionsProps {
  query: string
  response: string
  citations: any[]
  mode: string
  searchId?: string
  userId?: string
  isBookmarked?: boolean
  onBookmarkChange?: () => void
}

export function SearchActions({
  query,
  response,
  citations,
  mode,
  searchId,
  userId,
  isBookmarked = false,
  onBookmarkChange,
}: SearchActionsProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!searchId) {
      toast.error("Cannot share", "Search ID not available")
      return
    }

    setSharing(true)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId }),
      })

      const data = await res.json()

      if (data.success) {
        await navigator.clipboard.writeText(data.shareUrl)
        setCopied(true)
        toast.success("Link copied!", "Share link copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast.error("Failed to create share link")
      }
    } catch (error) {
      console.error("[v0] Share error:", error)
      toast.error("Failed to create share link")
    } finally {
      setSharing(false)
    }
  }

  const handleBookmark = async () => {
    if (!searchId || !userId) {
      toast.error("Cannot bookmark", "User or search ID not available")
      return
    }

    try {
      const method = bookmarked ? "DELETE" : "POST"
      const res = await fetch("/api/bookmarks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, searchId }),
      })

      if (res.ok) {
        setBookmarked(!bookmarked)
        toast.success(bookmarked ? "Bookmark removed" : "Bookmarked!")
        onBookmarkChange?.()
      } else {
        toast.error("Failed to update bookmark")
      }
    } catch (error) {
      console.error("[v0] Bookmark error:", error)
      toast.error("Failed to update bookmark")
    }
  }

  const handleExportMarkdown = () => {
    const markdown = exportToMarkdown(query, response, citations, mode)
    const filename = `${query.slice(0, 50).replace(/[^a-z0-9]/gi, "-")}.md`
    downloadMarkdown(markdown, filename)
    toast.success("Exported to Markdown")
  }

  const handleExportText = () => {
    const text = exportToText(query, response, citations, mode)
    const filename = `${query.slice(0, 50).replace(/[^a-z0-9]/gi, "-")}.txt`
    downloadText(text, filename)
    toast.success("Exported to Text")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 border-miami-aqua/20 hover:border-miami-aqua hover:bg-miami-aqua/5 transition-all duration-300 shadow-lg hover:shadow-miami-aqua/20"
          aria-label="More options"
        >
          <MoreVertical className="w-6 h-6 sm:w-5 sm:h-5 text-miami-aqua group-hover:scale-110 transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 text-base sm:text-sm p-2">
        <DropdownMenuItem onClick={handleShare} disabled={!searchId || sharing} className="py-3 sm:py-2">
          <Share2 className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
          {copied ? "Link copied!" : "Share"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleBookmark} disabled={!userId} className="py-3 sm:py-2">
          {bookmarked ? (
            <Check className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
          ) : (
            <Bookmark className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
          )}
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportMarkdown} className="py-3 sm:py-2">
          <Download className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
          Export as Markdown
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportText} className="py-3 sm:py-2">
          <Download className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
