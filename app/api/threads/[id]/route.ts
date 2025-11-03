import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { getThread, updateThreadTitle, deleteThread } from "@/lib/threads"

// GET /api/threads/[id] - Get a specific thread with all searches
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const thread = await getThread(params.id, user.id)

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    return NextResponse.json({ thread })
  } catch (error: any) {
    console.error("[v0] Get thread error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch thread" }, { status: 500 })
  }
}

// PATCH /api/threads/[id] - Update thread title
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const thread = await updateThreadTitle(params.id, user.id, title)

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    return NextResponse.json({ thread })
  } catch (error: any) {
    console.error("[v0] Update thread error:", error)
    return NextResponse.json({ error: error.message || "Failed to update thread" }, { status: 500 })
  }
}

// DELETE /api/threads/[id] - Delete a thread
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await deleteThread(params.id, user.id)

    if (!success) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Delete thread error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete thread" }, { status: 500 })
  }
}
