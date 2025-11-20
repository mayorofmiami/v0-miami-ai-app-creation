"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { PageHeader } from "@/components/page-header"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type { User } from "@/lib/auth"
import { UserContext } from "@/hooks/use-authenticated-user"

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode
}

export function AuthenticatedLayoutClient({ children }: AuthenticatedLayoutClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // If not authenticated, redirect to login
          router.push("/login")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch user:", error)
        router.push("/login")
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUser()
  }, [router])

  const handleNewChat = useCallback(() => {
    router.push("/app")
  }, [router])

  const handleToggleHistory = useCallback(() => {
    router.push("/app#history")
  }, [router])

  const handleToggleBookmarks = useCallback(() => {
    router.push("/app#bookmarks")
  }, [router])

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (response.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [router])

  const handleSearch = useCallback(
    (query: string) => {
      router.push(`/app?q=${encodeURIComponent(query)}`)
    },
    [router],
  )

  if (isLoadingUser || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const isAdmin = user.role === "owner" || user.role === "admin"

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <CollapsibleSidebar
          user={user}
          isLoadingUser={false}
          recentSearches={[]}
          onNewChat={handleNewChat}
          onSearchSelect={handleSearch}
          onToggleHistory={handleToggleHistory}
          onToggleBookmarks={handleToggleBookmarks}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          shouldLoadThreads={true}
        />

        <PageHeader
          hasSearched={true}
          isAuthenticated={true}
          isSidebarCollapsed={isSidebarCollapsed}
          isDrawerOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          isAdmin={isAdmin}
          recentSearches={[]}
          bookmarks={[]}
          user={user}
          isLoadingUser={false}
          theme={theme}
          setTheme={setTheme}
          handleNewChat={handleNewChat}
          handleToggleHistory={handleToggleHistory}
          handleToggleBookmarks={handleToggleBookmarks}
          handleSearch={handleSearch}
          searchMode="quick"
        />

        <main className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "md:pl-16" : "md:pl-64"}`}>
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}
