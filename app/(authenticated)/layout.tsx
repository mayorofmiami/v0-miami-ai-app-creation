import type React from "react"
import { AuthenticatedLayoutClient } from "@/components/authenticated-layout-client"

// This makes the layout a pure wrapper that doesn't cause server round-trips on navigation
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}
