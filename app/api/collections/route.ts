import { type NextRequest, NextResponse } from "next/server"
import { getUserCollections, createCollection, deleteCollection } from "@/lib/collections"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const collections = await getUserCollections(user.id)
    return NextResponse.json({ collections })
  } catch (error) {
    console.error("[v0] Collections API error:", error)
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }

    const collection = await createCollection(user.id, name, description)
    return NextResponse.json({ collection })
  } catch (error) {
    console.error("[v0] Create collection error:", error)
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const collectionId = req.nextUrl.searchParams.get("collectionId")
    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 })
    }

    const collection = await sql`
      SELECT user_id FROM collections WHERE id = ${collectionId}
    `

    if (collection.length === 0) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    if (collection[0].user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await deleteCollection(collectionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete collection error:", error)
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }
}
