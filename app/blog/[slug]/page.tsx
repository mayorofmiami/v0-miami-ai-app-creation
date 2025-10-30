import { neon } from "@neondatabase/serverless"
import { Logo } from "@/components/logo"
import { Calendar, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

const sql = neon(process.env.DATABASE_URL!)

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  published_at: string
  author_name: string | null
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const posts = await sql`
      SELECT 
        bp.id,
        bp.slug,
        bp.title,
        bp.content,
        bp.published_at,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.slug = ${slug} AND bp.status = 'published'
    `
    return (posts[0] as BlogPost) || null
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return null
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Link href="/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="container mx-auto px-4 py-12">
        <article className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8 pb-8 border-b border-border">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{post.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author_name}</span>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-p:text-pretty prose-a:text-miami-aqua prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <Link href="/blog">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Posts
              </Button>
            </Link>
          </footer>
        </article>
      </main>
    </div>
  )
}
