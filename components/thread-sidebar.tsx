"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import PlusIcon from "@/components/icons/Plus"
import ClockIcon from "@/components/icons/Clock"
import MoreVertical from "@/components/icons/MoreVertical"
import Edit from "@/components/icons/Edit"
import Trash from "@/components/icons/Trash"
import Search from "@/components/icons/Search"
import DownloadIcon from "@/components/icons/Download" // Fixed import name
import { toast } from "@/lib/toast"
import type { Thread } from "@/lib/threads"

interface ThreadSidebarProps {
  userId: string | null
  currentThreadId: string | null
  onThreadSelect: (threadId: string) => void
  onNewThread: () => void
  isCollapsed: boolean
}

export function ThreadSidebar({
  userId,
  currentThreadId,
  onThreadSelect,
  onNewThread,
  isCollapsed,
}: ThreadSidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Load threads
  useEffect(() => {
    console.log("[v0] ThreadSidebar mounted, userId:", userId)
    if (!userId) {
      setIsLoading(false)
      return
    }

    loadThreads()
  }, [userId])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredThreads(threads)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = threads.filter(
        (thread) => thread.title?.toLowerCase().includes(query) || thread.last_query?.toLowerCase().includes(query),
      )
      setFilteredThreads(filtered)
    }
  }, [searchQuery, threads])

  const loadThreads = async () => {
    console.log("[v0] Loading threads...")
    try {
      const res = await fetch("/api/threads")
      console.log("[v0] Threads API response status:", res.status)

      if (!res.ok) throw new Error("Failed to load threads")

      const data = await res.json()
      console.log("[v0] Threads API data:", data)
      console.log("[v0] Number of threads:", data.threads?.length || 0)

      setThreads(data.threads || [])
    } catch (error) {
      console.error("[v0] Load threads error:", error)
      toast.error("Failed to load threads")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete thread")

      setThreads((prev) => prev.filter((t) => t.id !== threadId))
      toast.success("Thread deleted")

      // If deleting current thread, create a new one
      if (threadId === currentThreadId) {
        onNewThread()
      }
    } catch (error) {
      console.error("[v0] Delete thread error:", error)
      toast.error("Failed to delete thread")
    }
  }

  const handleRenameThread = async (threadId: string) => {
    if (!editTitle.trim()) {
      setEditingThreadId(null)
      return
    }

    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      })

      if (!res.ok) throw new Error("Failed to rename thread")

      const data = await res.json()
      setThreads((prev) => prev.map((t) => (t.id === threadId ? data.thread : t)))
      toast.success("Thread renamed")
    } catch (error) {
      console.error("[v0] Rename thread error:", error)
      toast.error("Failed to rename thread")
    } finally {
      setEditingThreadId(null)
      setEditTitle("")
    }
  }

  const handleExportThread = async (threadId: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}`)
      if (!res.ok) throw new Error("Failed to load thread")

      const data = await res.json()
      const thread = data.thread

      // Create markdown export
      let markdown = `# ${thread.title || "Untitled Thread"}\n\n`
      markdown += `**Mode:** ${thread.mode}\n`
      markdown += `**Created:** ${new Date(thread.created_at).toLocaleString()}\n\n`
      markdown += `---\n\n`

      if (thread.searches && thread.searches.length > 0) {
        thread.searches.forEach((search: any, index: number) => {
          markdown += `## Search ${index + 1}: ${search.query}\n\n`
          markdown += `${search.response}\n\n`
          if (search.citations && search.citations.length > 0) {
            markdown += `### Sources\n\n`
            search.citations.forEach((citation: any, citIndex: number) => {
              markdown += `${citIndex + 1}. [${citation.title}](${citation.url})\n`
            })
            markdown += `\n`
          }
          markdown += `---\n\n`
        })
      }

      // Download as file
      const blob = new Blob([markdown], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${thread.title || "thread"}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Thread exported")
    } catch (error) {
      console.error("[v0] Export thread error:", error)
      toast.error("Failed to export thread")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (!userId) {
    return null
  }

  return (
    <div className={`flex flex-col h-full ${isCollapsed ? "items-center" : ""}`}>
      {/* New Thread Button */}
      <div className={`p-3 border-b border-border ${isCollapsed ? "flex justify-center" : ""}`}>
        <Button
          onClick={onNewThread}
          className={`${isCollapsed ? "w-10 h-10 p-0" : "w-full"} bg-miami-aqua hover:bg-miami-aqua/90 text-white`}
          title="New Chat"
        >
          <PlusIcon className={`h-5 w-5 ${isCollapsed ? "" : "mr-2"}`} />
          {!isCollapsed && <span>New Chat</span>}
        </Button>
      </div>

      {!isCollapsed && threads.length > 0 && (
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`${isCollapsed ? "h-10 w-10 mx-auto" : "h-16"} bg-muted/50 rounded-lg animate-pulse`}
              />
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          !isCollapsed && (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground">{searchQuery ? "No threads found" : "No threads yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try a different search" : "Start a new conversation"}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-1">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className={`group relative rounded-lg transition-colors ${
                  thread.id === currentThreadId
                    ? "bg-miami-aqua/10 border border-miami-aqua/30"
                    : "hover:bg-muted/50 border border-transparent"
                } ${isCollapsed ? "p-2 flex justify-center" : "p-3"}`}
              >
                {editingThreadId === thread.id && !isCollapsed ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRenameThread(thread.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameThread(thread.id)
                      if (e.key === "Escape") {
                        setEditingThreadId(null)
                        setEditTitle("")
                      }
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                ) : (
                  <>
                    <button
                      onClick={() => onThreadSelect(thread.id)}
                      className={`flex-1 text-left ${isCollapsed ? "hidden" : ""}`}
                      title={isCollapsed ? thread.title || "Untitled" : undefined}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground group-hover:text-miami-aqua transition-colors">
                            {thread.title || "Untitled Thread"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(thread.updated_at)}</span>
                            {thread.search_count !== undefined && thread.search_count > 0 && (
                              <span className="text-xs text-muted-foreground">• {thread.search_count} searches</span>
                            )}
                          </div>
                          {thread.last_query && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{thread.last_query}</p>
                          )}
                        </div>
                      </div>
                    </button>

                    {isCollapsed ? (
                      <button
                        onClick={() => onThreadSelect(thread.id)}
                        className="w-full h-full flex items-center justify-center"
                        title={thread.title || "Untitled"}
                      >
                        <ClockIcon className="w-5 h-5 text-muted-foreground" />
                      </button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingThreadId(thread.id)
                              setEditTitle(thread.title || "")
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportThread(thread.id)}>
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteThread(thread.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
