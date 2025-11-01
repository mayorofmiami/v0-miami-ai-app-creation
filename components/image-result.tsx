"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import DownloadIcon from "@/components/icons/Download"
import ShareIcon from "@/components/icons/Share"
import CopyIcon from "@/components/icons/Copy"

interface ImageResultProps {
  imageUrl: string
  prompt: string
  model: string
  resolution: string
  createdAt: string
  onRegenerate?: () => void
}

export function ImageResult({ imageUrl, prompt, model, resolution, createdAt, onRegenerate }: ImageResultProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = async () => {
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
      console.error("[v0] Download error:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in duration-500">
      {/* Image Display */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/20">
        <div className="relative aspect-square w-full">
          <Image src={imageUrl || "/placeholder.svg"} alt={prompt} fill className="object-contain" priority />
        </div>
      </div>

      {/* Prompt Display */}
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

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Model: {model.split("/").pop()}</span>
          <span>•</span>
          <span>{resolution}</span>
          <span>•</span>
          <span>{new Date(createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleDownload} disabled={isDownloading} className="flex-1">
          <DownloadIcon className="w-4 h-4 mr-2" />
          {isDownloading ? "Downloading..." : "Download"}
        </Button>

        {onRegenerate && (
          <Button onClick={onRegenerate} variant="outline" className="flex-1 bg-transparent">
            Regenerate
          </Button>
        )}

        <Button variant="outline" size="icon">
          <ShareIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
