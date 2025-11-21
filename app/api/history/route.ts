import { getSearchHistory } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 })
    }

    const history = await getSearchHistory(userId, 50)

    return Response.json(
      { history },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    logger.error("History API error", { error })
    return Response.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
