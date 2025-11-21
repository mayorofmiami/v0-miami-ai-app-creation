import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({
        remaining: 3,
        limit: 3,
        tier: "free",
      })
    }

    const status = await checkRateLimit(session.userId, "search")

    return NextResponse.json({
      remaining: status.remaining,
      resetAt: status.resetAt,
      tier: "authenticated",
    })
  } catch (error) {
    logger.error("Error fetching rate limit status", { error })
    return NextResponse.json({
      remaining: 1000,
      limit: 1000,
      tier: "authenticated",
    })
  }
}
