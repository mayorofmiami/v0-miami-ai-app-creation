"use client"

import type React from "react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Shield from "@/components/icons/Shield"
import type { User } from "@/lib/auth"

interface AdminLayoutClientProps {
  user: User
  children: React.ReactNode
}

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header - consistent across all admin pages */}
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Logo />
              <div className="hidden sm:flex items-center gap-2">
                <Shield className="w-4 h-4 text-miami-aqua" />
                <span className="text-sm font-semibold text-miami-aqua">Admin Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/app">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
                  Back to App
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main admin content */}
      <main>{children}</main>
    </div>
  )
}
