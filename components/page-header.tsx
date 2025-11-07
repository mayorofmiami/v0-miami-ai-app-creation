import Image from "next/image"
import { MobileDrawer } from "@/components/mobile-drawer"
import type { User } from "@stackframe/stack"

interface PageHeaderProps {
  hasSearched: boolean
  isAuthenticated: boolean
  isSidebarCollapsed: boolean
  isDrawerOpen: boolean
  onDrawerOpenChange: (open: boolean) => void
  isAdmin: boolean
  recentSearches: string[]
  user: User | null
  isLoadingUser: boolean
  theme: string
  setTheme: (theme: string) => void
  handleNewChat: () => void
  handleToggleHistory: () => void
  handleSearch: (query: string) => void
  searchMode: string
}

export function PageHeader({
  hasSearched,
  isAuthenticated,
  isSidebarCollapsed,
  isDrawerOpen,
  onDrawerOpenChange,
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
  // Determine logo visibility and size based on state
  const showLogo = hasSearched || isAuthenticated
  const logoSize = hasSearched
    ? { width: 160, height: 32, className: "h-10 md:h-12 w-auto" }
    : { width: 140, height: 28, className: "h-12 w-auto" }

  // Logo positioning - different for hasSearched state
  const logoPositionClasses = hasSearched
    ? "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 md:top-2 md:translate-y-0"
    : "absolute left-1/2 -translate-x-1/2"

  // Determine container classes based on state
  const containerClasses = [
    "fixed top-3 md:top-4 left-0 right-0 z-50 px-4 md:px-6 transition-all duration-300",
    hasSearched && (isSidebarCollapsed ? "md:left-16" : "md:left-64"),
    !hasSearched && !isAuthenticated && "pointer-events-none",
    isAuthenticated && !hasSearched && (isSidebarCollapsed ? "md:left-16" : "md:left-64"),
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={containerClasses}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between h-14 md:h-12 relative">
          <MobileDrawer
            isOpen={isDrawerOpen}
            onOpenChange={onDrawerOpenChange}
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
            <div className={logoPositionClasses}>
              <Image
                src="/miami-ai-logo.png"
                alt="MIAMI.AI"
                width={logoSize.width}
                height={logoSize.height}
                className={logoSize.className}
                priority
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
