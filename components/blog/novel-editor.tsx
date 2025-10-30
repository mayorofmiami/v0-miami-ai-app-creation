"use client"

import { EditorRoot, EditorContent } from "novel"
import { handleImageUpload } from "novel/plugins"

interface NovelEditorProps {
  initialContent?: string
  onChange: (content: string) => void
}

export function NovelEditor({ initialContent, onChange }: NovelEditorProps) {
  return (
    <EditorRoot>
      <EditorContent
        initialContent={initialContent}
        onUpdate={({ editor }) => {
          const html = editor.getHTML()
          onChange(html)
        }}
        extensions={[]}
        className="min-h-[500px] w-full rounded-lg border border-input bg-background p-4"
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => {
              // Handle keyboard shortcuts
              return false
            },
          },
          handlePaste: (view, event) => {
            // Handle image paste
            const items = Array.from(event.clipboardData?.items || [])
            for (const item of items) {
              if (item.type.indexOf("image") === 0) {
                event.preventDefault()
                const file = item.getAsFile()
                if (file) {
                  handleImageUpload(file, view, event)
                }
                return true
              }
            }
            return false
          },
          handleDrop: (view, event, _slice, moved) => {
            // Handle image drop
            if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
              const file = event.dataTransfer.files[0]
              if (file.type.indexOf("image") === 0) {
                event.preventDefault()
                handleImageUpload(file, view, event)
                return true
              }
            }
            return false
          },
          attributes: {
            class:
              "prose prose-lg dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-a:text-miami-aqua focus:outline-none max-w-full",
          },
        }}
      />
    </EditorRoot>
  )
}
