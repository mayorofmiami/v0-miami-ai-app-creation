"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Plus, Shield, Clock, Sun, Moon, User } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { HelpMenu } from "@/components/help-menu"
import BookmarkIcon from "@/components/icons/Bookmark"
import { useState } from "react"

interface MobileDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isAdmin: boolean
  recentSearches: string[]
  bookmarks?: Array<{ id: string; query: string; response: string; created_at: string }>
  user: { name?: string; email: string } | null
  isLoadingUser: boolean
  theme: string
  setTheme: (theme: string) => void
  handleNewChat: () => void
  handleToggleHistory: () => void
  handleToggleBookmarks?: () => void
  handleSearch: (query: string, mode: string) => void
  searchMode: string
  pointerEventsAuto?: boolean
}

export function MobileDrawer({
  isOpen,
  onOpenChange,
  isAdmin,
  recentSearches,
  bookmarks = [],
  user,
  isLoadingUser,
  theme,
  setTheme,
  handleNewChat,
  handleToggleHistory,
  handleToggleBookmarks,
  handleSearch,
  searchMode,
  pointerEventsAuto = false,
}: MobileDrawerProps) {
  const [isBookmarksExpanded, setIsBookmarksExpanded] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-sheet-trigger="true"
          className={`md:hidden group relative h-14 w-14 md:h-12 md:w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 border-miami-aqua/20 hover:border-miami-aqua hover:bg-miami-aqua/5 transition-all duration-normal shadow-lg hover:shadow-miami-aqua/20 ${
            pointerEventsAuto ? "pointer-events-auto" : ""
          }`}
          style={{ transition: "all var(--duration-normal) var(--easing-standard)" }}
          aria-label="Open menu"
        >
          <span
            className="text-miami-aqua text-2xl transition-transform"
            style={{ transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--easing-standard)" }}
          >
            <Menu size={28} className="text-miami-aqua md:w-6 md:h-6 group-hover:scale-110" />
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[340px] sm:w-80 flex flex-col">
        <div className="flex flex-col items-center gap-4 py-4">
          <Image
            src="/miami-ai-logo.png"
            alt="MIAMI.AI"
            width={180}
            height={36}
            className="h-9 w-auto"
            sizes="180px"
            priority
          />
        </div>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0" aria-label="Main navigation">
          <Button
            variant="ghost"
            className="w-full justify-start text-base text-muted-foreground hover:text-foreground h-12 px-4"
            onClick={handleNewChat}
          >
            <span className="text-xl mr-3">
              <Plus size={20} />
            </span>
            New Chat
          </Button>

          <Link href="/council" onClick={() => onOpenChange(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-base text-miami-pink hover:text-miami-pink hover:bg-miami-pink/10 h-12 px-4"
            >
              <span className="text-xl mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              The Council
            </Button>
          </Link>

          {isAdmin && (
            <Link href="/admin" onClick={() => onOpenChange(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start text-base text-miami-aqua hover:text-miami-aqua hover:bg-miami-aqua/10 h-12 px-4"
              >
                <span className="text-xl mr-3">
                  <Shield size={20} className="text-miami-aqua" />
                </span>
                Admin Dashboard
              </Button>
            </Link>
          )}

          {user && bookmarks.length > 0 && (
            <div className="pt-5 border-t border-border mt-2">
              <button
                onClick={() => setIsBookmarksExpanded(!isBookmarksExpanded)}
                className="flex items-center justify-between px-4 mb-3 w-full hover:bg-muted/30 rounded-lg py-2 transition-colors"
              >
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bookmarks</p>
                <div className="flex items-center gap-2">
                  {handleToggleBookmarks && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleBookmarks()
                        onOpenChange(false)
                      }}
                      className="text-sm font-medium text-miami-aqua hover:text-miami-aqua/80 transition-colors"
                    >
                      See All
                    </button>
                  )}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-muted-foreground transition-transform duration-200 ${
                      isBookmarksExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>
              {isBookmarksExpanded && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bookmarks.slice(0, 5).map((bookmark) => (
                    <button
                      key={bookmark.id}
                      onClick={() => {
                        handleSearch(bookmark.query, searchMode)
                        onOpenChange(false)
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <BookmarkIcon className="w-4 h-4 text-miami-aqua fill-current flex-shrink-0" />
                        <span className="text-base text-foreground group-hover:text-miami-aqua transition-colors line-clamp-1">
                          {bookmark.query}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="pt-5 border-t border-border mt-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</p>
                <button
                  onClick={() => {
                    handleToggleHistory()
                    onOpenChange(false)
                  }}
                  className="text-sm font-medium text-miami-aqua hover:text-miami-aqua/80 transition-colors"
                >
                  See All
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleSearch(search, searchMode)
                      onOpenChange(false)
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground flex-shrink-0">
                        <Clock size={16} />
                      </span>
                      <span className="text-base text-foreground group-hover:text-miami-aqua transition-colors line-clamp-1">
                        {search}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-5 border-t border-border mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-base px-4 py-6 h-auto hover:bg-accent"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="mr-3 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="mr-3 h-5 w-5 absolute left-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Theme</span>
            </Button>
          </div>

          <div className="border-t border-border pt-3 mt-2">
            <HelpMenu isMobile />
          </div>
        </nav>

        <div className="border-t pt-6 pb-8 mt-auto">
          {isLoadingUser ? (
            <div className="flex items-center gap-3 px-4">
              <div className="w-12 h-12 rounded-full bg-muted/50 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/50 rounded w-24 animate-pulse" />
                <div className="h-3 bg-muted/50 rounded w-32 animate-pulse" />
              </div>
            </div>
          ) : user ? (
            <>
              <Link href="/profile" onClick={() => onOpenChange(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-miami-aqua/20 to-miami-pink/20 flex items-center justify-center flex-shrink-0 border border-miami-aqua/20">
                    <span className="text-miami-aqua text-2xl">
                      <User size={24} className="text-miami-aqua" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate group-hover:text-miami-aqua transition-colors">
                      {user.name || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              <Link href="/login" onClick={() => onOpenChange(false)} className="block">
                <Button className="w-full bg-miami-aqua hover:bg-miami-aqua/90 text-white font-medium h-12 rounded-lg shadow-sm hover:shadow-md transition-all text-base">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => onOpenChange(false)} className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-lg border-2 border-border hover:border-miami-aqua hover:bg-miami-aqua/5 font-medium transition-all bg-transparent text-base"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
