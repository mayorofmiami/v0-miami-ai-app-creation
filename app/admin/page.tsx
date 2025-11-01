"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"
import { StatCard } from "@/components/stat-card"
import { AdminChart } from "@/components/admin-chart"
import Users from "@/components/icons/Users"
import Search from "@/components/icons/Search"
import Zap from "@/components/icons/Zap"
import DollarSign from "@/components/icons/DollarSign"
import TrendingUp from "@/components/icons/TrendingUp"
import Clock from "@/components/icons/Clock"
import RefreshCw from "@/components/icons/RefreshCw"
import Shield from "@/components/icons/Shield"
import UserSearch from "@/components/icons/UserSearch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AdminStats {
  totalUsers: number
  totalSearches: number
  proSubscribers: number
  searchesToday: number
  searchesByMode: Record<string, number>
  estimatedCost: string
  revenue: string
  dailyTrends: Array<{ date: string; count: number }>
  topQueries: Array<{ query: string; count: number }>
  userGrowth: Array<{ date: string; count: number }>
  modelUsage?: Array<{
    model: string
    request_count: number
    total_input_tokens: number
    total_output_tokens: number
    total_cost: number
  }>
}

interface RecentSearch {
  query: string
  mode: string
  created_at: string
  email: string | null
}

interface AdminAction {
  id: string
  action_type: string
  admin_email: string
  admin_name: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
}

interface UserData {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  plan: string | null
  status: string | null
  search_count: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [adminActions, setAdminActions] = useState<AdminAction[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchStats() {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/admin/stats`)
      if (!res.ok) {
        throw new Error("Unauthorized or failed to fetch stats")
      }

      const data = await res.json()
      setStats(data.stats)
      setRecentSearches(data.recentSearches)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  async function fetchAdminActions() {
    try {
      const res = await fetch(`/api/admin/activity`)
      if (res.ok) {
        const data = await res.json()
        setAdminActions(data.actions)
      }
    } catch (err) {
      console.error("Failed to fetch admin actions:", err)
    }
  }

  async function fetchUsers(search = "") {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error("Failed to fetch users:", err)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchAdminActions()
    fetchUsers()
  }, [])

  const handleRefresh = () => {
    fetchStats()
    fetchAdminActions()
    fetchUsers(userSearch)
  }

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(userSearch)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-miami-aqua border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
              <Link href="/">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
                  Back to App
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                  Back
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""} sm:mr-2`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Tabs for different admin sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="blog" asChild>
              <Link href="/admin/blog">Blog</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users className="w-6 h-6" />} />
              <StatCard
                title="Total Searches"
                value={stats?.totalSearches || 0}
                icon={<Search className="w-6 h-6" />}
                trend="12% from last week"
                trendUp
              />
              <StatCard
                title="Pro Subscribers"
                value={stats?.proSubscribers || 0}
                icon={<Zap className="w-6 h-6" />}
                trend="8% from last week"
                trendUp
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${stats?.revenue || "0.00"}`}
                icon={<DollarSign className="w-6 h-6" />}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stats?.dailyTrends && (
                <AdminChart data={stats.dailyTrends} title="Search Trends (7 Days)" color="#02D8E9" />
              )}
              {stats?.userGrowth && (
                <AdminChart data={stats.userGrowth} title="User Growth (30 Days)" color="#FFB6C1" />
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-miami-aqua" />
                  <h3 className="font-semibold">Searches Today</h3>
                </div>
                <p className="text-3xl font-bold">{stats?.searchesToday || 0}</p>
              </div>

              <div className="bg-muted/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-miami-pink" />
                  <h3 className="font-semibold">Search Modes</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quick:</span>
                    <span className="font-semibold">{stats?.searchesByMode?.quick || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Deep:</span>
                    <span className="font-semibold">{stats?.searchesByMode?.deep || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-miami-aqua" />
                  <h3 className="font-semibold">Estimated API Cost</h3>
                </div>
                <p className="text-3xl font-bold">${stats?.estimatedCost || "0.00"}</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </div>

            {/* Model Usage Breakdown */}
            {stats?.modelUsage && stats.modelUsage.length > 0 && (
              <div className="bg-muted/50 border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Model Usage & Costs (30 Days)</h3>
                <div className="space-y-3">
                  {stats.modelUsage.map((usage, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{usage.model}</p>
                        <p className="text-xs text-muted-foreground">
                          {usage.request_count} requests • {Math.round(Number(usage.total_input_tokens) / 1000)}K input
                          • {Math.round(Number(usage.total_output_tokens) / 1000)}K output
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${Number(usage.total_cost).toFixed(4)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Queries */}
            {stats?.topQueries && stats.topQueries.length > 0 && (
              <div className="bg-muted/50 border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Top Queries (7 Days)</h3>
                <div className="space-y-2">
                  {stats.topQueries.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <span className="text-sm font-medium line-clamp-1">{item.query}</span>
                      <span className="text-sm text-muted-foreground ml-4">{item.count} searches</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            <div className="bg-muted/50 border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-miami-aqua" />
                <h3 className="text-lg font-semibold">Recent Searches</h3>
              </div>
              <div className="space-y-3">
                {recentSearches.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No searches yet</p>
                ) : (
                  recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-background rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground line-clamp-1 text-pretty">{search.query}</p>
                        <p className="text-sm text-muted-foreground mt-1">{search.email || "Anonymous"}</p>
                      </div>
                      <div className="flex-shrink-0 ml-4 text-right">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            search.mode === "deep"
                              ? "bg-miami-pink/20 text-miami-pink"
                              : "bg-miami-aqua/20 text-miami-aqua"
                          }`}
                        >
                          {search.mode}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(search.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Users tab with search functionality */}
          <TabsContent value="users" className="space-y-6">
            <div className="bg-muted/50 border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <UserSearch className="w-5 h-5 text-miami-aqua" />
                  <h3 className="text-lg font-semibold">User Management</h3>
                </div>
                <form onSubmit={handleUserSearch} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search by email or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-64"
                  />
                  <Button type="submit" size="sm">
                    Search
                  </Button>
                </form>
              </div>

              <div className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.email}</p>
                          {user.role === "owner" && (
                            <Badge variant="default" className="bg-miami-aqua text-white">
                              Owner
                            </Badge>
                          )}
                          {user.role === "admin" && (
                            <Badge variant="default" className="bg-miami-pink text-white">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.name || "No name"}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                          <span>Searches: {user.search_count}</span>
                          {user.plan && (
                            <span className="capitalize">
                              Plan: {user.plan} ({user.status})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Activity Log tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="bg-muted/50 border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-miami-aqua" />
                <h3 className="text-lg font-semibold">Admin Activity Log</h3>
              </div>

              <div className="space-y-3">
                {adminActions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity yet</p>
                ) : (
                  adminActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start justify-between p-3 bg-background rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{action.action_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by {action.admin_name || action.admin_email}
                          </span>
                        </div>
                        {action.target_type && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Target: {action.target_type} {action.target_id && `(${action.target_id.slice(0, 8)}...)`}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatDate(action.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Blog tab */}
          <TabsContent value="blog" className="space-y-6">
            <div className="bg-muted/50 border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-miami-aqua" />
                <h3 className="text-lg font-semibold">Blog Management</h3>
              </div>

              <div className="space-y-3">
                <p className="text-center text-muted-foreground py-8">Blog content goes here</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
