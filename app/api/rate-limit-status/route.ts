import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { checkRateLimit } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ remaining: 100, limit: 100 })
    }

    const { allowed, remaining } = await checkRateLimit(session.userId)

    return NextResponse.json({
      remaining: remaining || 1000,
      limit: 1000,
    })
  } catch (error) {
    console.error("[v0] Error fetching rate limit status:", error)
    return NextResponse.json({ remaining: 1000, limit: 1000 })
  }
}
