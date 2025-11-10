import { getThreadMessages } from "@/lib/db"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const threadId = params.id

    if (!threadId) {
      return Response.json({ error: "Thread ID required" }, { status: 400 })
    }

    const messages = await getThreadMessages(threadId)

    return Response.json(
      { messages },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Thread API error:", error)
    return Response.json({ error: "Failed to fetch thread" }, { status: 500 })
  }
}
