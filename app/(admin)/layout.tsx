import type React from "react"
import { requireAdmin } from "@/lib/auth"
import { AdminLayoutClient } from "@/components/admin-layout-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify admin access at layout level - redirects if not admin/owner
  const user = await requireAdmin()

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>
}
