"use client"

import Link from "next/link"
import { ThemeSwitcher } from "./theme-switcher"
import { Button } from "./ui/button"
import { useUser } from "@stackframe/stack"
import { MessageSquare } from "lucide-react"

export function AppHeader() {
  const user = useUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href={user ? "/app" : "/"} className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6" />
          <span className="font-bold">Miami.AI</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeSwitcher />

          {user ? (
            <>
              {(user.clientMetadata?.role === "admin" || user.clientMetadata?.role === "owner") && (
                <Button variant="ghost" asChild>
                  <Link href="/admin/rate-limits">Admin</Link>
                </Button>
              )}
              <Button variant="ghost" onClick={() => user.signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/handler/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
