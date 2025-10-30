"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, ThumbsUp, ThumbsDown, Share2, RotateCw, Bookmark, Check } from "lucide-react"
import { toast } from "@/lib/toast"

interface ResponseActionsProps {
  query: string
  response: string
  searchId?: string
  userId?: string
  isBookmarked?: boolean
  onBookmarkChange?: () => void
  onRegenerate?: () => void
}

export function ResponseActions({
  query,
  response,
  searchId,
  userId,
  isBookmarked = false,
  onBookmarkChange,
  onRegenerate,
}: ResponseActionsProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

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
        toast.success("Link copied!", "Share link copied to clipboard")
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

  const handleFeedback = async (type: "up" | "down") => {
    if (!searchId || !userId) {
      toast.error("Sign in to provide feedback")
      return
    }

    setFeedback(type)
    toast.success(`Thanks for your feedback!`)
    // TODO: Implement feedback API endpoint
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors"
        aria-label="Copy response"
        title="Copy"
      >
        {copied ? (
          <Check className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-miami-aqua" />
        ) : (
          <Copy className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-muted-foreground hover:text-foreground" />
        )}
      </Button>

      {/* Thumbs Up Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleFeedback("up")}
        className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors"
        aria-label="Good response"
        title="Good response"
      >
        <ThumbsUp
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${feedback === "up" ? "text-miami-aqua fill-miami-aqua" : "text-muted-foreground hover:text-foreground"}`}
        />
      </Button>

      {/* Thumbs Down Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleFeedback("down")}
        className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors"
        aria-label="Bad response"
        title="Bad response"
      >
        <ThumbsDown
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${feedback === "down" ? "text-miami-aqua fill-miami-aqua" : "text-muted-foreground hover:text-foreground"}`}
        />
      </Button>

      {/* Share Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleShare}
        disabled={!searchId || sharing}
        className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors"
        aria-label="Share"
        title="Share"
      >
        <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-muted-foreground hover:text-foreground" />
      </Button>

      {/* Regenerate Button */}
      {onRegenerate && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRegenerate}
          className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors"
          aria-label="Regenerate"
          title="Regenerate"
        >
          <RotateCw className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-muted-foreground hover:text-foreground" />
        </Button>
      )}

      {/* Bookmark Button */}
      {userId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBookmark}
          className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          title={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          {bookmarked ? (
            <Bookmark className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-miami-aqua fill-miami-aqua" />
          ) : (
            <Bookmark className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-muted-foreground hover:text-foreground" />
          )}
        </Button>
      )}
    </div>
  )
}
