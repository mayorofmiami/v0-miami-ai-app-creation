import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { User, History } from "lucide-react"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl space-y-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Profile</h1>
          <Link href="/">
            <Button variant="outline">Back to Search</Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {/* User Info Card */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-miami-pink/20 flex items-center justify-center">
                <User className="w-6 h-6 text-miami-pink" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/#history" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <History className="w-4 h-4 mr-2" />
                  View Search History
                </Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
