import { neon } from "@neondatabase/serverless"
import { Logo } from "@/components/logo"
import { Calendar, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const sql = neon(process.env.DATABASE_URL!)

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  published_at: string
  author_name: string | null
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const posts = await sql`
      SELECT 
        bp.id,
        bp.slug,
        bp.title,
        bp.excerpt,
        bp.published_at,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'published'
      ORDER BY bp.published_at DESC
    `
    return posts as BlogPost[]
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

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
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Search
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Miami.ai Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Updates, announcements, and insights from the Miami.ai team
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <main className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-8 max-w-4xl mx-auto">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-muted/30 border border-border rounded-xl p-6 md:p-8 hover:border-miami-aqua/50 transition-colors"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 hover:text-miami-aqua transition-colors text-balance">
                    {post.title}
                  </h2>
                </Link>

                {post.excerpt && <p className="text-muted-foreground mb-4 text-lg leading-relaxed">{post.excerpt}</p>}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                  {post.author_name && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{post.author_name}</span>
                    </div>
                  )}
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <Button variant="outline" size="sm" className="group bg-transparent">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
