"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import Copy from "@/components/icons/Copy"
import Share from "@/components/icons/Share"
import RotateCw from "@/components/icons/RotateCw"
import Bookmark from "@/components/icons/Bookmark"
import { toast } from "sonner"

interface ResponseActionsProps {
  response: string
  onRegenerate?: () => void
  query?: string
  searchId?: string
  userId?: string | null
}

export function ResponseActions({ response, onRegenerate, query, searchId, userId }: ResponseActionsProps) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(response)
      toast.success("Response copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy response")
    }
  }, [response])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Miami.ai Search Result",
          text: response,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopy()
      toast.success("Link copied to clipboard")
    }
  }, [response, handleCopy])

  const handleBookmark = useCallback(() => {
    toast.success("Response bookmarked")
  }, [])

  const handleRegenerateClick = useCallback(() => {
    if (onRegenerate) {
      onRegenerate()
    }
  }, [onRegenerate])

  return (
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
        className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-miami-aqua/10 hover:text-miami-aqua transition-colors"
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
        className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-miami-aqua/10 hover:text-miami-aqua transition-colors"
        aria-label="Bookmark response"
      >
        <Bookmark className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </Button>
    </div>
  )
}
