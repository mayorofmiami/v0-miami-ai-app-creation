"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Share2, RefreshCw } from "lucide-react"

interface ResponseActionsProps {
  query: string
  response?: string
  searchId?: string
  userId?: string
  onRegenerate?: () => void
}

export function ResponseActions({ query, response, onRegenerate }: ResponseActionsProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const handleCopy = async () => {
    if (!response) return
    await navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share && response) {
      try {
        await navigator.share({
          title: query,
          text: response,
        })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch (err) {
        // User cancelled or share failed
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-9 gap-2 text-muted-foreground hover:text-foreground"
      >
        <Copy className="w-4 h-4" />
        <span>{copied ? "Copied!" : "Copy"}</span>
      </Button>

      {navigator.share && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-9 gap-2 text-muted-foreground hover:text-foreground"
        >
          <Share2 className="w-4 h-4" />
          <span>{shared ? "Shared!" : "Share"}</span>
        </Button>
      )}

      {onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-9 gap-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Regenerate</span>
        </Button>
      )}
    </div>
  )
}
