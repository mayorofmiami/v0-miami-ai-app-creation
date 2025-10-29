import { type NextRequest, NextResponse } from "next/server"
import { createShareLink } from "@/lib/share"

export async function POST(req: NextRequest) {
  try {
    const { searchId } = await req.json()

    if (!searchId) {
      return NextResponse.json({ error: "Search ID required" }, { status: 400 })
    }

    const result = await createShareLink(searchId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/shared/${result.shareToken}`

    return NextResponse.json({ success: true, shareUrl })
  } catch (error) {
    console.error("[v0] Share API error:", error)
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
  }
}
