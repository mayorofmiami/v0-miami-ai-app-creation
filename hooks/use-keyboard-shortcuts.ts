"use client"

import { useEffect, useCallback } from "react"

export type KeyboardShortcut = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, preventDefault = true, stopPropagation = false } = options

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs (unless explicitly allowed)
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape to work in inputs
        if (e.key !== "Escape") return
      }

      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey
        const metaMatches = shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey
        const shiftMatches = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey
        const altMatches = shortcut.altKey === undefined || shortcut.altKey === e.altKey

        // For Cmd/Ctrl shortcuts, check either key
        const cmdCtrlMatches = shortcut.ctrlKey || shortcut.metaKey ? e.ctrlKey || e.metaKey : true

        if (keyMatches && cmdCtrlMatches && shiftMatches && altMatches) {
          if (preventDefault) e.preventDefault()
          if (stopPropagation) e.stopPropagation()
          shortcut.action()
          break
        }
      }
    },
    [shortcuts, enabled, preventDefault, stopPropagation],
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown, enabled])
}

// Preset shortcut builders
export const createShortcut = {
  cmd: (key: string, action: () => void, description: string): KeyboardShortcut => ({
    key,
    metaKey: true,
    ctrlKey: true,
    description: `⌘${key.toUpperCase()}: ${description}`,
    action,
  }),
  cmdShift: (key: string, action: () => void, description: string): KeyboardShortcut => ({
    key,
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    description: `⌘⇧${key.toUpperCase()}: ${description}`,
    action,
  }),
  escape: (action: () => void, description = "Cancel"): KeyboardShortcut => ({
    key: "Escape",
    description: `Esc: ${description}`,
    action,
  }),
  key: (key: string, action: () => void, description: string): KeyboardShortcut => ({
    key,
    description: `${key.toUpperCase()}: ${description}`,
    action,
  }),
}
