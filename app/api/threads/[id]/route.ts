import { getThreadMessages, deleteThread } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { logger } from "@/lib/logger"

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
    logger.error("Thread API error", { error })
    return Response.json({ error: "Failed to fetch thread" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const threadId = params.id

    if (!threadId) {
      return Response.json({ error: "Thread ID required" }, { status: 400 })
    }

    const result = await deleteThread(threadId, user.id)

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    logger.error("Delete thread API error", { error })
    return Response.json({ error: "Failed to delete thread" }, { status: 500 })
  }
}
