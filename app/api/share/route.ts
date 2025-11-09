import { type NextRequest, NextResponse } from "next/server"
import { createShareLink, createDirectShareLink } from "@/lib/share"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.searchId) {
      // Existing pattern: Share a saved search from database
      const result = await createShareLink(body.searchId)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/shared/${result.shareToken}`
      return NextResponse.json({ success: true, shareUrl, shareId: result.shareToken })
    } else if (body.query && body.response) {
      // New pattern: Share a response directly without searchId
      const result = await createDirectShareLink(body.query, body.response, body.userId)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, shareId: result.shareToken })
    } else {
      return NextResponse.json({ error: "Either searchId or query+response required" }, { status: 400 })
    }
    // </CHANGE>
  } catch (error) {
    console.error("[v0] Share API error:", error)
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
  }
}
