"use client"

import { useEffect } from "react"
import { toast } from "@/lib/toast"

interface KeyboardShortcutsProps {
  onSearch: () => void
  onClear: () => void
  onToggleMode: () => void
  onToggleHistory: () => void
  onNewChat: () => void
}

export function KeyboardShortcuts({
  onSearch,
  onClear,
  onToggleMode,
  onToggleHistory,
  onNewChat,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onSearch()
      }

      // Escape: Clear search
      if (e.key === "Escape") {
        e.preventDefault()
        onClear()
      }

      // Cmd/Ctrl + N: New chat
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault()
        onNewChat()
      }

      // Cmd/Ctrl + D: Toggle Deep Research mode
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault()
        onToggleMode()
      }

      // Cmd/Ctrl + H: Toggle history
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault()
        onToggleHistory()
      }

      // Cmd/Ctrl + /: Show shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        toast.info("Keyboard Shortcuts", {
          description: "⌘K: Focus search\n⌘N: New chat\n⌘D: Toggle mode\n⌘H: History\nEsc: Clear",
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSearch, onClear, onToggleMode, onToggleHistory, onNewChat])

  return null
}
