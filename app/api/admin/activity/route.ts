import { requireAdmin } from "@/lib/auth"
import { getAdminActions } from "@/lib/admin-logger"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 50
    const offset = (page - 1) * limit

    const actions = await getAdminActions(limit, offset)

    return Response.json(
      {
        actions,
        pagination: {
          page,
          limit,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      },
    )
  } catch (error) {
    logger.error("Admin activity error", error)
    return Response.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
