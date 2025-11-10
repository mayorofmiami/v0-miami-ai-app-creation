"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import Copy from "@/components/icons/Copy"
import Share from "@/components/icons/Share"
import RotateCw from "@/components/icons/RotateCw"
import Bookmark from "@/components/icons/Bookmark"
import { ShareModal } from "@/components/share-modal"
import { AuthPromptDialog } from "@/components/auth-prompt-dialog"
import { toast } from "sonner"

interface ResponseActionsProps {
  response: string
  onRegenerate?: () => void
  query?: string
  searchId?: string
  userId?: string | null
  isBookmarked?: boolean
  onBookmarkChange?: (bookmarked: boolean) => void
}

export function ResponseActions({
  response,
  onRegenerate,
  query,
  searchId,
  userId,
  isBookmarked = false,
  onBookmarkChange,
}: ResponseActionsProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [isBookmarking, setIsBookmarking] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(response)
      toast.success("Response copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy response")
    }
  }, [response])

  const handleShare = useCallback(async () => {
    if (isSharing) return

    try {
      setIsSharing(true)

      // Create share link via API
      const shareResponse = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query || "Search Result",
          response,
          userId,
        }),
      })

      if (!shareResponse.ok) {
        throw new Error("Failed to create share link")
      }

      const { shareId } = await shareResponse.json()
      const url = `${window.location.origin}/share/${shareId}`

      setShareUrl(url)
      setShareModalOpen(true)
    } catch (error) {
      toast.error("Failed to create share link")
    } finally {
      setIsSharing(false)
    }
  }, [response, query, userId, isSharing])

  const handleBookmark = useCallback(async () => {
    if (!userId) {
      setAuthPromptOpen(true)
      // Store pending bookmark in localStorage so we can save it after sign in
      if (typeof window !== "undefined" && query) {
        localStorage.setItem(
          "pendingBookmark",
          JSON.stringify({
            query,
            response,
            timestamp: Date.now(),
          }),
        )
      }
      return
    }

    if (!searchId) {
      toast.error("Unable to bookmark this response")
      return
    }

    if (isBookmarking) return

    try {
      setIsBookmarking(true)

      if (bookmarked) {
        const response = await fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchId }),
        })

        if (!response.ok) {
          throw new Error("Failed to remove bookmark")
        }

        setBookmarked(false)
        onBookmarkChange?.(false)
      } else {
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to add bookmark")
        }

        setBookmarked(true)
        onBookmarkChange?.(true)
      }
    } catch (error) {
      toast.error("Failed to update bookmark")
    } finally {
      setIsBookmarking(false)
    }
  }, [userId, searchId, query, response, bookmarked, isBookmarking, onBookmarkChange])

  const handleRegenerateClick = useCallback(() => {
    if (onRegenerate) {
      onRegenerate()
    }
  }, [onRegenerate])

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Copy Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-miami-aqua/10 hover:text-miami-aqua transition-colors"
          aria-label="Copy response"
        >
          <Copy className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </Button>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          disabled={isSharing}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-miami-aqua/10 hover:text-miami-aqua transition-colors disabled:opacity-50"
          aria-label="Share response"
        >
          <Share className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </Button>

        {/* Regenerate Button */}
        {onRegenerate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerateClick}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-miami-aqua/10 hover:text-miami-aqua transition-colors"
            aria-label="Regenerate response"
          >
            <RotateCw className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </Button>
        )}

        {/* Bookmark Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          disabled={isBookmarking}
          className={`h-8 w-8 sm:h-9 sm:w-9 p-0 transition-colors disabled:opacity-50 ${
            bookmarked ? "text-miami-aqua hover:bg-miami-aqua/10" : "hover:bg-miami-aqua/10 hover:text-miami-aqua"
          }`}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark response"}
        >
          <Bookmark className={`h-4 w-4 sm:h-[18px] sm:w-[18px] ${bookmarked ? "fill-current" : ""}`} />
        </Button>
      </div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        title={query || "Miami.AI Search Result"}
      />

      <AuthPromptDialog open={authPromptOpen} onOpenChange={setAuthPromptOpen} feature="bookmark responses" />
    </>
  )
}
