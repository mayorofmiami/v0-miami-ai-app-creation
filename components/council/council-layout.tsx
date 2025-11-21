"use client"

import type React from "react"
import { logger } from "@/lib/logger"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { PageHeader } from "@/components/page-header"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { storage } from "@/lib/local-storage"

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface CouncilLayoutProps {
  children: React.ReactNode
}

export function CouncilLayout({ children }: CouncilLayoutProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const cachedData = storage.getItem("miami_user_cache", null)
      if (cachedData && cachedData.user) {
        return cachedData.user
      }
    }
    return null
  })

  const [isLoadingUser, setIsLoadingUser] = useState(() => {
    if (typeof window !== "undefined") {
      const cachedData = storage.getItem("miami_user_cache", null)
      return !cachedData
    }
    return true
  })

  const [uiState, setUIState] = useState({
    isDrawerOpen: false,
    isSidebarCollapsed: true,
    sidebarLoaded: false,
  })

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/init")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)

          if (typeof window !== "undefined" && data.user) {
            const currentCache = storage.getItem("miami_user_cache", {})
            storage.setItem("miami_user_cache", {
              ...currentCache,
              user: data.user,
              timestamp: Date.now(),
            })
          }
        }
      } catch (error) {
        logger.error("Error loading user in council layout", { error })
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!uiState.isSidebarCollapsed && !uiState.sidebarLoaded) {
      setUIState((prev) => ({ ...prev, sidebarLoaded: true }))
    }
  }, [uiState.isSidebarCollapsed, uiState.sidebarLoaded])

  const handleLogout = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        storage.removeItem("miami_user_cache")
      }

      const formData = new FormData()
      await fetch("/api/auth/logout", { method: "POST", body: formData })

      window.location.href = "/"
    } catch (error) {
      logger.error("Error logging out from council", { error })
    }
  }, [])

  const handleNewChat = useCallback(() => {
    router.push("/app")
  }, [router])

  const isAdmin = user?.role === "owner" || user?.role === "admin"

  if (isLoadingUser && !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>
  }

  return (
    <>
      <CollapsibleSidebar
        user={user}
        isLoadingUser={isLoadingUser}
        recentSearches={[]}
        onNewChat={handleNewChat}
        onSearchSelect={() => {}}
        onToggleHistory={() => {}}
        onToggleBookmarks={() => {}}
        onSelectThread={() => {}}
        onLogout={handleLogout}
        isCollapsed={uiState.isSidebarCollapsed}
        setIsCollapsed={(collapsed) => setUIState((prev) => ({ ...prev, isSidebarCollapsed: collapsed }))}
        shouldLoadThreads={uiState.sidebarLoaded}
      />

      <div className="min-h-screen flex flex-col">
        <div className="fixed inset-x-0 top-0 h-26 md:h-32 bg-gradient-to-b from-background via-background to-transparent pointer-events-none z-40" />

        <PageHeader
          hasSearched={true}
          isAuthenticated={!!user}
          isSidebarCollapsed={uiState.isSidebarCollapsed}
          isDrawerOpen={uiState.isDrawerOpen}
          onOpenChange={(open) => setUIState((prev) => ({ ...prev, isDrawerOpen: open }))}
          isAdmin={isAdmin}
          recentSearches={[]}
          bookmarks={[]}
          user={user}
          isLoadingUser={isLoadingUser}
          theme={theme || "dark"}
          setTheme={setTheme}
          handleNewChat={handleNewChat}
          handleToggleHistory={() => {}}
          handleToggleBookmarks={() => {}}
          handleSearch={() => {}}
          searchMode="quick"
        />

        <main
          id="main-content"
          className="flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 pb-36 md:pb-32 pt-20 md:pt-24"
        >
          {children}
        </main>
      </div>
    </>
  )
}
