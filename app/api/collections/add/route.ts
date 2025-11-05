import { type NextRequest, NextResponse } from "next/server"
import { addSearchToCollection } from "@/lib/collections"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { collectionId, searchId } = await req.json()

    if (!collectionId || !searchId) {
      return NextResponse.json({ error: "Collection ID and search ID required" }, { status: 400 })
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

    await addSearchToCollection(collectionId, searchId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Add to collection error:", error)
    return NextResponse.json({ error: "Failed to add to collection" }, { status: 500 })
  }
}
