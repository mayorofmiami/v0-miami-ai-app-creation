"use client"

import { Button } from "@/components/ui/button"
import LogOut from "@/components/icons/LogOut"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/actions/auth"
import { useState } from "react"
import { storage } from "@/lib/local-storage"

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      storage.removeItem("miami_user_cache")

      await logoutAction()

      window.location.href = "/"
    } catch (error) {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 bg-transparent"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isLoading ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
