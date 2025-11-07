import { type NextRequest, NextResponse } from "next/server"
import { getUserThreads } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const threads = await getUserThreads(userId, 20)
    return NextResponse.json({ threads })
  } catch (error) {
    console.error("[v0] Error fetching threads:", error)
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 })
  }
}
