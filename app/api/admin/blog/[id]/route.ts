import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"
import { logger } from "@/lib/logger"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const post = await sql`
      SELECT 
        id, 
        title, 
        slug, 
        excerpt, 
        content, 
        author_id, 
        status, 
        published_at, 
        created_at, 
        updated_at 
      FROM blog_posts 
      WHERE id = ${params.id}
    `

    if (post.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(
      { post: post[0] },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    logger.error("Error fetching blog post", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
      SELECT id FROM blog_posts WHERE slug = ${slug} AND id != ${params.id}
    `

    if (existingPost.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    const currentPost = await sql`
      SELECT status, published_at FROM blog_posts WHERE id = ${params.id}
    `

    if (currentPost.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    let publishedAt = currentPost[0].published_at
    if (status === "published" && currentPost[0].status === "draft") {
      publishedAt = new Date().toISOString()
    }

    const result = await sql`
      UPDATE blog_posts
      SET title = ${title},
          slug = ${slug},
          excerpt = ${excerpt || null},
          content = ${content},
          status = ${status},
          published_at = ${publishedAt}
      WHERE id = ${params.id}
      RETURNING *
    `

    return NextResponse.json({ post: result[0] })
  } catch (error) {
    logger.error("Error updating blog post", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    await sql`
      DELETE FROM blog_posts WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error deleting blog post", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
