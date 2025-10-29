import { type NextRequest, NextResponse } from "next/server"
import { addSearchToCollection } from "@/lib/collections"

export async function POST(req: NextRequest) {
  try {
    const { collectionId, searchId } = await req.json()

    if (!collectionId || !searchId) {
      return NextResponse.json({ error: "Collection ID and search ID required" }, { status: 400 })
    }

    await addSearchToCollection(collectionId, searchId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Add to collection error:", error)
    return NextResponse.json({ error: "Failed to add to collection" }, { status: 500 })
  }
}
