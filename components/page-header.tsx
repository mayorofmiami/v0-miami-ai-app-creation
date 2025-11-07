"use client"

import Image from "next/image"
import { MobileDrawer } from "@/components/mobile-drawer"

interface PageHeaderProps {
  hasSearched: boolean
  isAuthenticated: boolean
  isSidebarCollapsed: boolean
  isDrawerOpen: boolean
  onOpenChange: (open: boolean) => void
  isAdmin: boolean
  recentSearches: string[]
  user: any
  isLoadingUser: boolean
  theme: string | undefined
  setTheme: (theme: string) => void
  handleNewChat: () => void
  handleToggleHistory: () => void
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
  user,
  isLoadingUser,
  theme,
  setTheme,
  handleNewChat,
  handleToggleHistory,
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
        !hasSearched && !isAuthenticated ? "pointer-events-none" : ""
      } ${isSidebarCollapsed ? "md:left-16" : "md:left-64"}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between h-14 md:h-12 relative">
          <MobileDrawer
            isOpen={isDrawerOpen}
            onOpenChange={onOpenChange}
            isAdmin={isAdmin}
            recentSearches={recentSearches}
            user={user}
            isLoadingUser={isLoadingUser}
            theme={theme || "dark"}
            setTheme={setTheme}
            handleNewChat={handleNewChat}
            handleToggleHistory={handleToggleHistory}
            handleSearch={handleSearch}
            searchMode={searchMode}
          />

          {showLogo && (
            <div className={logoPositionClass}>
              <Image
                src="/miami-ai-logo.png"
                alt="MIAMI.AI"
                width={logoWidth}
                height={logoHeight}
                className={logoClassName}
                priority
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
