"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from 'next/navigation'
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
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [uiState, setUIState] = useState({
    isDrawerOpen: false,
    isSidebarCollapsed: true,
    sidebarLoaded: false,
  })

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/init')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('[v0] Error loading user:', error)
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
      console.error('[v0] Error logging out:', error)
    }
  }, [])

  const handleNewChat = useCallback(() => {
    router.push('/')
  }, [router])

  const isAdmin = user?.role === "owner" || user?.role === "admin"

  if (isLoadingUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <>
      <CollapsibleSidebar
        user={user}
        isLoadingUser={false}
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
          isLoadingUser={false}
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
