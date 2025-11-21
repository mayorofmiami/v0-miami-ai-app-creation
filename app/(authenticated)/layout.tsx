import type React from "react"
import { AuthenticatedLayoutClient } from "@/components/authenticated-layout-client"
import { ThemeProvider } from "@/components/theme-provider"

// This makes the layout a pure wrapper that doesn't cause server round-trips on navigation
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // enableSystem=false prevents system theme from overriding user selection
    // forcedTheme removed to allow user toggling between light/dark
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
    </ThemeProvider>
  )
}
