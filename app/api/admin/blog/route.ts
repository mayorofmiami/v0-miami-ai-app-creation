import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"
import { logger } from "@/lib/logger"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await sql`
      SELECT role FROM users WHERE id = ${session.userId}
    `

    if (!user[0] || (user[0].role !== "admin" && user[0].role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const posts = await sql`
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.content,
        bp.author_id,
        bp.status,
        bp.published_at,
        bp.created_at,
        bp.updated_at,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ORDER BY bp.created_at DESC
    `

    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    logger.error("Error fetching blog posts", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch posts"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await sql`
      SELECT role FROM users WHERE id = ${session.userId}
    `

    if (!user[0] || (user[0].role !== "admin" && user[0].role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, slug, excerpt, content, status } = await request.json()

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingPost = await sql`
      SELECT id FROM blog_posts WHERE slug = ${slug}
    `

    if (existingPost.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    const publishedAt = status === "published" ? new Date().toISOString() : null

    const result = await sql`
      INSERT INTO blog_posts (title, slug, excerpt, content, author_id, status, published_at)
      VALUES (${title}, ${slug}, ${excerpt || null}, ${content}, ${session.userId}, ${status}, ${publishedAt})
      RETURNING *
    `

    return NextResponse.json({ post: result[0] })
  } catch (error) {
    logger.error("Error creating blog post", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
