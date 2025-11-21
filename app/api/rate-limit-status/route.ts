import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getRateLimitStatus } from "@/lib/unified-rate-limit"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({
        remaining: 100,
        limit: 100,
        tier: "free",
      })
    }

    const status = await getRateLimitStatus(session.userId, null, "global")

    return NextResponse.json({
      remaining: status.remaining,
      limit: status.limit,
      resetAt: status.resetAt,
      tier: status.tier,
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
