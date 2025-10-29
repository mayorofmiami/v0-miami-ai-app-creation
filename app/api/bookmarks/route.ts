import { type NextRequest, NextResponse } from "next/server"
import { addBookmark, removeBookmark, getBookmarks } from "@/lib/bookmarks"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  const bookmarks = await getBookmarks(userId)
  return NextResponse.json({ bookmarks })
}

export async function POST(req: NextRequest) {
  try {
    const { userId, searchId } = await req.json()

    if (!userId || !searchId) {
      return NextResponse.json({ error: "User ID and search ID required" }, { status: 400 })
    }

    const result = await addBookmark(userId, searchId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Bookmark API error:", error)
    return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, searchId } = await req.json()

    if (!userId || !searchId) {
      return NextResponse.json({ error: "User ID and search ID required" }, { status: 400 })
    }

    const result = await removeBookmark(userId, searchId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Bookmark API error:", error)
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
  }
}
