"use client"

import Paperclip from "@/components/icons/Paperclip"
import X from "@/components/icons/X"
import type { Attachment } from "@/components/model-selector"

interface AttachmentListProps {
  attachments: Attachment[]
  onRemove: (id: string) => void
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  if (attachments.length === 0) return null

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="relative group flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border"
        >
          {attachment.preview ? (
            <img
              src={attachment.preview || "/placeholder.svg"}
              alt={attachment.name}
              className="w-10 h-10 object-cover rounded"
            />
          ) : (
            <div className="w-10 h-10 bg-muted-foreground/10 rounded flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
