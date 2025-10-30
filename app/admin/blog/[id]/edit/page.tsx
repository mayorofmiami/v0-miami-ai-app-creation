"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Shield, Save, Eye } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { RichTextEditor } from "@/components/blog/rich-text-editor"

export default function EditBlogPostPage() {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/admin/blog/${postId}`)
        if (!res.ok) throw new Error("Failed to fetch post")
        const data = await res.json()
        setTitle(data.post.title)
        setSlug(data.post.slug)
        setExcerpt(data.post.excerpt || "")
        setContent(data.post.content)
        setStatus(data.post.status)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to load post")
        router.push("/admin/blog")
      } finally {
        setIsLoading(false)
      }
    }
    fetchPost()
  }, [postId, router])

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleSubmit = async (e: React.FormEvent, publishNow = false) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          status: publishNow ? "published" : status,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update post")
      }

      router.push("/admin/blog")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update post")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-miami-aqua border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-miami-aqua" />
              <span className="text-sm font-semibold text-miami-aqua">Edit Blog Post</span>
            </div>
          </div>
          <Link href="/admin/blog">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="mb-2 block">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                required
                className="text-lg"
              />
            </div>

            <div>
              <Label htmlFor="slug" className="mb-2 block">
                Slug (URL)
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="post-url-slug"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Will appear as: /blog/{slug || "your-slug"}</p>
            </div>

            <div>
              <Label htmlFor="excerpt" className="mb-2 block">
                Excerpt (Optional)
              </Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content" className="mb-2 block">
                Content
              </Label>
              <RichTextEditor initialContent={content} onChange={setContent} />
              <p className="text-xs text-muted-foreground mt-1">
                Rich text editor with image support. Use the toolbar for formatting.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t">
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={(e) => {
                setStatus("draft")
                handleSubmit(e, false)
              }}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              type="button"
              className="bg-miami-aqua hover:bg-miami-aqua/90 w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {status === "published" ? "Update & Keep Published" : "Publish Now"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
