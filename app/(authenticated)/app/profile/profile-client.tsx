"use client"

import { useAuthenticatedUser } from "@/hooks/use-authenticated-user"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import User from "@/components/icons/User"
import History from "@/components/icons/History"
import Settings from "@/components/icons/Settings"
import Bell from "@/components/icons/Bell"
import Shield from "@/components/icons/Shield"
import Database from "@/components/icons/Database"
import Palette from "@/components/icons/Palette"
import HelpCircle from "@/components/icons/HelpCircle"
import { LogoutButton } from "@/components/logout-button"

export default function ProfileClient() {
  const user = useAuthenticatedUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-miami-aqua border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold gradient-text">Profile</h1>
          <Link href="/app">
            <Button variant="outline" className="h-11 px-6 text-base bg-transparent">
              Back to Search
            </Button>
          </Link>
        </div>

        {/* User Info Card */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-miami-pink/20 flex items-center justify-center">
              <User className="w-8 h-8 text-miami-pink" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-base text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-base text-muted-foreground">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/app#history" className="block">
              <Button variant="outline" className="w-full justify-start bg-transparent h-12 text-base">
                <History className="w-5 h-5 mr-3" />
                View Search History
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Settings Categories */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Settings</h2>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start h-12 text-base" disabled>
              <Settings className="w-5 h-5 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-medium">General</div>
                <div className="text-sm text-muted-foreground">App preferences and defaults</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-base" disabled>
              <Bell className="w-5 h-5 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-muted-foreground">Manage notification preferences</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-base" disabled>
              <Database className="w-5 h-5 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-medium">Data Controls</div>
                <div className="text-sm text-muted-foreground">Manage your data and privacy</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-base" disabled>
              <Palette className="w-5 h-5 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-medium">Personalization</div>
                <div className="text-sm text-muted-foreground">Customize your experience</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-base" disabled>
              <Shield className="w-5 h-5 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-medium">Security</div>
                <div className="text-sm text-muted-foreground">Password and security settings</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-base" disabled>
              <HelpCircle className="w-5 h-5 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-medium">Help & Support</div>
                <div className="text-sm text-muted-foreground">Get help and contact support</div>
              </div>
            </Button>

            <p className="text-sm text-muted-foreground px-3 pt-2">Additional settings coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
