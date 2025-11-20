"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { PageHeader } from "@/components/page-header"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type { User } from "@/lib/auth"

interface AuthenticatedLayoutClientProps {
  user: User
  children: React.ReactNode
}

export function AuthenticatedLayoutClient({ user, children }: AuthenticatedLayoutClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleNewChat = useCallback(() => {
    router.push("/app")
  }, [router])

  const handleToggleHistory = useCallback(() => {
    // Navigate to history view or open history sidebar
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

  const isAdmin = user.role === "owner" || user.role === "admin"

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - consistent across all authenticated pages */}
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

      {/* Header - consistent across all authenticated pages */}
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

      {/* Main content area - offset by sidebar */}
      <main className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "md:pl-16" : "md:pl-64"}`}>
        {children}
      </main>
    </div>
  )
}
