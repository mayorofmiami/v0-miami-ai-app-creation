import type React from "react"
import { requireAuth } from "@/lib/auth"
import { AuthenticatedLayoutClient } from "@/components/authenticated-layout-client"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user once at layout level - all child pages get this automatically
  const user = await requireAuth() // Redirects to /login if not authenticated

  return <AuthenticatedLayoutClient user={user}>{children}</AuthenticatedLayoutClient>
}
