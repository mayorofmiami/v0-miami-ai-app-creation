"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/auth"
import { UserContext } from "@/hooks/use-authenticated-user"

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode
}

export function AuthenticatedLayoutClient({ children }: AuthenticatedLayoutClientProps) {
  const router = useRouter()
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
        router.push("/login")
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUser()
  }, [router])

  if (isLoadingUser || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen bg-background">{children}</div>
    </UserContext.Provider>
  )
}
