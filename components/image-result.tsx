"use client"

import { useState, useCallback, memo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import DownloadIcon from "@/components/icons/Download"
import ShareIcon from "@/components/icons/Share"
import CopyIcon from "@/components/icons/Copy"
import { ShareModal } from "@/components/share-modal"
import { toast } from "sonner"

interface ImageResultProps {
  imageUrl: string
  prompt: string
  model: string
  resolution: string
  createdAt: string
  onRegenerate?: () => void
  userId?: string | null
}

export const ImageResult = memo(function ImageResult({
  imageUrl,
  prompt,
  model,
  resolution,
  createdAt,
  onRegenerate,
  userId,
}: ImageResultProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `miami-ai-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
    } finally {
      setIsDownloading(false)
    }
  }, [imageUrl])

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [prompt])

  const handleShare = useCallback(async () => {
    if (isSharing) return

    try {
      setIsSharing(true)

      // Create a formatted response for the image
      const responseText = `Generated Image\n\nPrompt: ${prompt}\nModel: ${model}\nResolution: ${resolution}\n\nImage URL: ${imageUrl}`

      // Create share link via API
      const shareResponse = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: prompt,
          response: responseText,
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
  }, [imageUrl, prompt, model, resolution, userId, isSharing])

  const handleRegenerate = useCallback(() => {
    if (onRegenerate && !isRegenerating) {
      setIsRegenerating(true)
      onRegenerate()
      // Reset after 3 seconds (image generation typically takes time)
      setTimeout(() => setIsRegenerating(false), 3000)
    }
  }, [onRegenerate, isRegenerating])

  return (
    <>
      <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in duration-500">
        {isRegenerating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-miami-aqua border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Regenerating image...</p>
            </div>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/20">
          <div className="relative aspect-square w-full">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={prompt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 768px, 896px"
              priority
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Prompt</p>
              <p className="text-base text-foreground leading-relaxed">{prompt}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopyPrompt} className="shrink-0">
              <CopyIcon className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Model: {model.split("/").pop()}</span>
            <span>•</span>
            <span>{resolution}</span>
            <span>•</span>
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleDownload} disabled={isDownloading} className="flex-1">
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>

          {onRegenerate && (
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={isRegenerating}
            >
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={handleShare} disabled={isSharing}>
            <ShareIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        title={`Generated Image: ${prompt}`}
      />
    </>
  )
})
