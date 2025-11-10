"use client"

import Image from "next/image"
import { MobileDrawer } from "@/components/mobile-drawer"
import type { User } from "@/types"

interface PageHeaderProps {
  hasSearched: boolean
  isAuthenticated: boolean
  isSidebarCollapsed: boolean
  isDrawerOpen: boolean
  onOpenChange: (open: boolean) => void
  isAdmin: boolean
  recentSearches: string[]
  bookmarks?: Array<{ id: string; query: string; response: string; created_at: string }>
  user: User | null
  isLoadingUser: boolean
  theme: string | undefined
  setTheme: (theme: string) => void
  handleNewChat: () => void
  handleToggleHistory: () => void
  handleToggleBookmarks?: () => void
  handleSearch: (query: string, mode: "quick" | "deep") => void
  searchMode: "quick" | "deep"
}

export function PageHeader({
  hasSearched,
  isAuthenticated,
  isSidebarCollapsed,
  isDrawerOpen,
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
}: PageHeaderProps) {
  const showLogo = hasSearched || isAuthenticated
  const logoWidth = hasSearched ? 160 : 140
  const logoHeight = hasSearched ? 32 : 28
  const logoClassName = hasSearched ? "h-10 md:h-12 w-auto" : "h-12 w-auto"

  const logoPositionClass = hasSearched
    ? "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 md:top-2 md:translate-y-0"
    : "absolute left-1/2 -translate-x-1/2"

  return (
    <div
      className={`fixed top-3 md:top-4 left-0 right-0 z-50 px-4 md:px-6 transition-all duration-300 ${
        isSidebarCollapsed ? "md:left-16" : "md:left-64"
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between h-14 md:h-12 relative">
          <div className="pointer-events-auto">
            <MobileDrawer
              isOpen={isDrawerOpen}
              onOpenChange={onOpenChange}
              isAdmin={isAdmin}
              recentSearches={recentSearches}
              bookmarks={bookmarks}
              user={user}
              isLoadingUser={isLoadingUser}
              theme={theme || "dark"}
              setTheme={setTheme}
              handleNewChat={handleNewChat}
              handleToggleHistory={handleToggleHistory}
              handleToggleBookmarks={handleToggleBookmarks}
              handleSearch={handleSearch}
              searchMode={searchMode}
            />
          </div>

          {showLogo && (
            <div className={logoPositionClass}>
              <Image
                src="/miami-ai-logo.png"
                alt="MIAMI.AI"
                width={logoWidth}
                height={logoHeight}
                className={logoClassName}
                sizes="(max-width: 768px) 140px, 180px"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
