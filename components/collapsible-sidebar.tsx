"use client"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import UserIcon from "@/components/icons/User"
import PlusIcon from "@/components/icons/Plus"
import ClockIcon from "@/components/icons/Clock"
import SunIcon from "@/components/icons/Sun"
import MoonIcon from "@/components/icons/Moon"
import Palmtree from "@/components/icons/Palmtree"
import ShieldIcon from "@/components/icons/Shield"
import BookmarkIcon from "@/components/icons/Bookmark"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { threadStorage, type LocalThread } from "@/lib/local-storage"
import { HelpMenu } from "@/components/help-menu"

interface Thread {
  id: string
  title: string
  message_count: number
  last_message_at: string
}

interface Bookmark {
  id: string
  query: string
  response: string
  created_at: string
  bookmarked_at: string
}

interface CollapsibleSidebarProps {
  user: { id: string; email: string; name: string | null; role?: string } | null
  isLoadingUser: boolean
  recentSearches: string[]
  onNewChat: () => void
  onSearchSelect: (search: string) => void
  onToggleHistory: () => void
  onToggleBookmarks?: () => void
  onSelectThread?: (threadId: string) => void
  onLogout: () => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  shouldLoadThreads?: boolean
}

export function CollapsibleSidebar({
  user,
  isLoadingUser,
  recentSearches,
  onNewChat,
  onSearchSelect,
  onToggleHistory,
  onToggleBookmarks,
  onSelectThread,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  shouldLoadThreads = true,
}: CollapsibleSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [threads, setThreads] = useState<Thread[]>([])
  const [localThreads, setLocalThreads] = useState<LocalThread[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false)
  const [isBookmarksExpanded, setIsBookmarksExpanded] = useState(false)

  const isAdmin = user?.role === "owner" || user?.role === "admin"

  useEffect(() => {
    async function fetchThreads() {
      if (!user?.id || !shouldLoadThreads) {
        setThreads([])
        return
      }

      setIsLoadingThreads(true)
      try {
        const response = await fetch(`/api/threads?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setThreads(data.threads || [])
        }
      } catch (error) {
        console.error("Failed to fetch threads:", error)
      } finally {
        setIsLoadingThreads(false)
      }
    }

    fetchThreads()
  }, [user?.id, shouldLoadThreads])

  useEffect(() => {
    async function fetchBookmarks() {
      if (!user?.id || !shouldLoadThreads) {
        setBookmarks([])
        return
      }

      setIsLoadingBookmarks(true)
      try {
        const response = await fetch("/api/bookmarks")
        if (response.ok) {
          const data = await response.json()
          setBookmarks(data.bookmarks || [])
        }
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error)
      } finally {
        setIsLoadingBookmarks(false)
      }
    }

    fetchBookmarks()
  }, [user?.id, shouldLoadThreads])

  useEffect(() => {
    if (!user?.id) {
      const threads = threadStorage.getThreads()
      setLocalThreads(threads)

      // Set up polling to update threads when they change
      const interval = setInterval(() => {
        const updatedThreads = threadStorage.getThreads()
        setLocalThreads(updatedThreads)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [user?.id])

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
  }

  return (
    <div
      className={`hidden md:flex fixed left-0 top-0 h-screen bg-background border-r border-border flex-col z-50 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{ transition: "width var(--duration-normal) var(--easing-standard)" }}
    >
      {/* Header with Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex-1">
            <Logo />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-9 w-9 rounded-full hover:bg-accent flex-shrink-0"
          style={{ transition: "all var(--duration-fast) var(--easing-standard)" }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Palmtree className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto">
        {/* New Chat */}
        <Button
          variant="ghost"
          className={`justify-start h-10 ${isCollapsed ? "px-0 justify-center" : ""}`}
          style={{ transition: "all var(--duration-fast) var(--easing-standard)" }}
          onClick={onNewChat}
          title="New Chat"
        >
          <PlusIcon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && <span>New Chat</span>}
        </Button>

        {isAdmin && (
          <Link href="/admin">
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 ${isCollapsed ? "px-0 justify-center" : ""} text-miami-aqua hover:text-miami-aqua hover:bg-miami-aqua/10`}
              title="Admin Dashboard"
            >
              <ShieldIcon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && <span>Admin</span>}
            </Button>
          </Link>
        )}

        {user && bookmarks.length > 0 && (
          <div className={`pt-4 ${isCollapsed ? "" : "border-t border-border"}`}>
            {!isCollapsed && (
              <>
                <button
                  onClick={() => setIsBookmarksExpanded(!isBookmarksExpanded)}
                  className="flex items-center justify-between px-3 mb-2 w-full hover:bg-muted/30 rounded-lg py-1"
                  style={{ transition: "background-color var(--duration-fast) var(--easing-standard)" }}
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bookmarks</p>
                  <div className="flex items-center gap-2">
                    {onToggleBookmarks && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleBookmarks()
                        }}
                        className="text-xs font-medium text-miami-aqua hover:text-miami-aqua/80 transition-colors"
                      >
                        See All
                      </button>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                      style={{
                        transition: "transform var(--duration-fast) var(--easing-standard)",
                        transform: isBookmarksExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </button>
              </>
            )}
            {(isCollapsed || isBookmarksExpanded) && (
              <div className="space-y-1">
                {(isCollapsed ? bookmarks.slice(0, 3) : bookmarks.slice(0, 5)).map((bookmark) => (
                  <button
                    key={bookmark.id}
                    onClick={() => onSearchSelect(bookmark.query)}
                    className={`w-full text-left rounded-lg hover:bg-muted/50 group ${
                      isCollapsed ? "px-0 py-2 flex justify-center" : "px-3 py-2"
                    }`}
                    style={{ transition: "background-color var(--duration-fast) var(--easing-standard)" }}
                    title={isCollapsed ? bookmark.query : undefined}
                  >
                    {isCollapsed ? (
                      <BookmarkIcon className="w-5 h-5 text-miami-aqua fill-current" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <BookmarkIcon className="w-4 h-4 text-miami-aqua fill-current flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm text-foreground group-hover:text-miami-aqua line-clamp-1"
                            style={{ transition: "color var(--duration-fast) var(--easing-standard)" }}
                          >
                            {bookmark.query}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(bookmark.bookmarked_at || bookmark.created_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {user
          ? // Authenticated: Show database threads
            threads.length > 0 && (
              <div className={`pt-4 ${isCollapsed ? "" : "border-t border-border"}`}>
                {!isCollapsed && (
                  <div className="flex items-center justify-between px-3 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</p>
                    <button
                      onClick={onToggleHistory}
                      className="text-xs font-medium text-miami-aqua hover:text-miami-aqua/80"
                      style={{ transition: "color var(--duration-fast) var(--easing-standard)" }}
                    >
                      See All
                    </button>
                  </div>
                )}
                <div className="space-y-1">
                  {(isCollapsed ? threads.slice(0, 3) : threads.slice(0, 5)).map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => {
                        if (onSelectThread) {
                          onSelectThread(thread.id)
                        } else {
                          window.location.href = `/?thread=${thread.id}`
                        }
                      }}
                      className={`w-full text-left rounded-lg hover:bg-muted/50 group relative ${
                        isCollapsed ? "px-0 py-2 flex justify-center" : "px-3 py-2"
                      }`}
                      style={{ transition: "background-color var(--duration-fast) var(--easing-standard)" }}
                      title={isCollapsed ? thread.title : undefined}
                    >
                      {isCollapsed ? (
                        <ClockIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm text-foreground group-hover:text-miami-aqua line-clamp-1"
                              style={{ transition: "color var(--duration-fast) var(--easing-standard)" }}
                            >
                              {thread.title}
                            </p>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          : // Non-authenticated: Show local threads from localStorage
            localThreads.length > 0 && (
              <div className={`pt-4 ${isCollapsed ? "" : "border-t border-border"}`}>
                {!isCollapsed && (
                  <div className="flex items-center justify-between px-3 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</p>
                  </div>
                )}
                <div className="space-y-1">
                  {(isCollapsed ? localThreads.slice(0, 3) : localThreads.slice(0, 5)).map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => onSearchSelect(thread.queries[thread.queries.length - 1])}
                      className={`w-full text-left rounded-lg hover:bg-muted/50 group ${
                        isCollapsed ? "px-0 py-2 flex justify-center" : "px-3 py-2"
                      }`}
                      style={{ transition: "background-color var(--duration-fast) var(--easing-standard)" }}
                      title={isCollapsed ? thread.title : undefined}
                    >
                      {isCollapsed ? (
                        <ClockIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm text-foreground group-hover:text-miami-aqua line-clamp-1"
                              style={{ transition: "color var(--duration-fast) var(--easing-standard)" }}
                            >
                              {thread.title}
                            </p>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

        {/* Theme Toggle */}
        <div className={`pt-4 mt-auto ${isCollapsed ? "" : "border-t border-border"}`}>
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10"
            >
              {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full justify-start h-10 px-3"
            >
              {theme === "dark" ? <SunIcon className="h-5 w-5 mr-3" /> : <MoonIcon className="h-5 w-5 mr-3" />}
              <span className="text-sm">Theme</span>
            </Button>
          )}
        </div>

        {/* Help Menu */}
        <div className={`${isCollapsed ? "" : "border-t border-border pt-2"}`}>
          <HelpMenu isCollapsed={isCollapsed} />
        </div>
      </nav>

      {/* Account Section */}
      <div className="border-t p-3">
        {isLoadingUser ? (
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-muted/50 animate-pulse" />
            {!isCollapsed && (
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted/50 rounded w-20 animate-pulse" />
                <div className="h-2 bg-muted/50 rounded w-24 animate-pulse" />
              </div>
            )}
          </div>
        ) : user ? (
          <>
            <Link href="/profile">
              <div
                className={`flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group ${
                  isCollapsed ? "justify-center p-2" : "p-2"
                }`}
                title={isCollapsed ? user.name || user.email : undefined}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-miami-aqua/20 to-miami-pink/20 flex items-center justify-center flex-shrink-0 border border-miami-aqua/20">
                  <UserIcon className="w-4 h-4 text-miami-aqua" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate group-hover:text-miami-aqua transition-colors">
                      {user.name || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
              </div>
            </Link>
          </>
        ) : (
          <div className={`flex flex-col gap-2 ${isCollapsed ? "items-center" : ""}`}>
            {isCollapsed ? (
              <>
                <Link href="/login" className="w-full">
                  <Button size="icon" className="w-full h-9 bg-miami-aqua hover:bg-miami-aqua/90" title="Sign In">
                    <UserIcon className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="w-full">
                  <Button className="w-full bg-miami-aqua hover:bg-miami-aqua/90 text-white text-xs h-9">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="w-full">
                  <Button variant="outline" className="w-full text-xs h-9 border-2 bg-transparent">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
