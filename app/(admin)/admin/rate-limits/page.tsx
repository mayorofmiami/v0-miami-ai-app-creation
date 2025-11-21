import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { RateLimitManager } from "@/components/admin/rate-limit-manager"

export default async function RateLimitsPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    redirect("/")
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Rate Limit Configuration</h1>
          <p className="text-muted-foreground">
            Manage rate limits for different features, models, and user tiers. Changes take effect immediately.
          </p>
        </div>
        <RateLimitManager />
      </main>
    </div>
  )
}
