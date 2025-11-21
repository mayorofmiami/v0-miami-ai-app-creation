import { type NextRequest, NextResponse } from "next/server"
import { addBookmark, removeBookmark, getBookmarks } from "@/lib/bookmarks"
import { getCurrentUser } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bookmarks = await getBookmarks(user.id)

  return NextResponse.json(
    { bookmarks },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    },
  )
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchId } = await req.json()

    if (!searchId) {
      return NextResponse.json({ error: "Search ID required" }, { status: 400 })
    }

    const result = await addBookmark(user.id, searchId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Bookmark API error", error)
    return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchId } = await req.json()

    if (!searchId) {
      return NextResponse.json({ error: "Search ID required" }, { status: 400 })
    }

    const result = await removeBookmark(user.id, searchId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Bookmark API error", error)
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
  }
}
