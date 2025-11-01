"use client"

import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Plus from "@/components/icons/Plus"
import Edit from "@/components/icons/Edit"
import Trash2 from "@/components/icons/Trash2"
import Eye from "@/components/icons/Eye"
import Shield from "@/components/icons/Shield"
import RefreshCw from "@/components/icons/RefreshCw"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  status: string
  published_at: string | null
  created_at: string
  updated_at: string
  author_name: string | null
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  async function fetchPosts() {
    try {
      setRefreshing(true)
      const res = await fetch("/api/admin/blog")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.error?.includes("does not exist")) {
          throw new Error("Blog database not initialized. Please run the migration at /api/admin/migrate")
        }
        throw new Error("Failed to fetch blog posts")
      }
      const data = await res.json()
      setPosts(data.posts)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete post")
      fetchPosts()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post")
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-miami-aqua border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading blog posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Setup Required</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center">
            {error.includes("migration") && (
              <Link href="/api/admin/migrate" target="_blank">
                <Button className="bg-miami-aqua hover:bg-miami-aqua/90">Run Migration</Button>
              </Link>
            )}
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
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
                <span className="text-sm font-semibold text-miami-aqua whitespace-nowrap">Blog Management</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
                  Back to Dashboard
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                  Back
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPosts}
                disabled={refreshing}
                className="hidden sm:inline-flex bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPosts}
                disabled={refreshing}
                className="sm:hidden bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Link href="/admin/blog/new">
                <Button size="sm" className="bg-miami-aqua hover:bg-miami-aqua/90">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Post</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Blog Posts</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your blog posts and announcements</p>
          </div>

          {posts.length === 0 ? (
            <div className="bg-muted/50 border border-border rounded-xl p-8 sm:p-12 text-center">
              <p className="text-muted-foreground mb-4">No blog posts yet</p>
              <Link href="/admin/blog/new">
                <Button className="bg-miami-aqua hover:bg-miami-aqua/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-muted/50 border border-border rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-semibold line-clamp-1">{post.title}</h3>
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
                      </div>
                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-2 mb-3 text-sm">{post.excerpt}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">/{post.slug}</span>
                        <span>
                          {post.status === "published" && post.published_at
                            ? `Published ${formatDate(post.published_at)}`
                            : `Created ${formatDate(post.created_at)}`}
                        </span>
                        {post.author_name && <span>By {post.author_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {post.status === "published" && (
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/blog/${post.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => deletePost(post.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
