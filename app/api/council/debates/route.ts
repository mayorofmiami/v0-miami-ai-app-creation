import { type NextRequest, NextResponse } from "next/server"
import { getUserDebates, searchUserDebates, getDebateDetails } from "@/lib/council/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")
  const search = searchParams.get("search")
  const debateId = searchParams.get("debateId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  try {
    // Get specific debate details
    if (debateId) {
      const debate = await getDebateDetails(debateId)
      return NextResponse.json(
        { debate },
        {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
          },
        },
      )
    }

    // Search debates
    if (search) {
      const debates = await searchUserDebates(userId, search)
      return NextResponse.json(
        { debates },
        {
          headers: {
            "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
          },
        },
      )
    }

    // Get all user debates
    const debates = await getUserDebates(userId)
    return NextResponse.json(
      { debates },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error) {
    logger.error("Error fetching debates", error)
    return NextResponse.json({ error: "Failed to fetch debates" }, { status: 500 })
  }
}
