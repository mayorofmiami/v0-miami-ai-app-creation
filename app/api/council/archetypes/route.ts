import { getAllArchetypes, getArchetypesByCategory } from "@/lib/council/db"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    const archetypes = category ? await getArchetypesByCategory(category) : await getAllArchetypes()

    return Response.json(
      { archetypes },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    logger.error("Error fetching archetypes", error)
    return Response.json({ error: "Failed to fetch archetypes" }, { status: 500 })
  }
}
