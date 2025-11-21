import { type NextRequest, NextResponse } from "next/server"
import { getUserThreads } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const threads = await getUserThreads(userId, 20)
    return NextResponse.json(
      { threads },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    logger.error("Error fetching threads", { error })
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 })
  }
}
