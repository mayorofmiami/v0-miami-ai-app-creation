import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createThread, getUserThreads } from "@/lib/threads"

// GET /api/threads - List all threads for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    console.log("[v0] GET /api/threads - user:", user?.id)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const threads = await getUserThreads(user.id)
    console.log("[v0] GET /api/threads - found threads:", threads.length)

    return NextResponse.json({ threads })
  } catch (error: any) {
    console.error("[v0] Get threads error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch threads" }, { status: 500 })
  }
}

// POST /api/threads - Create a new thread
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, mode = "quick" } = body

    const thread = await createThread(user.id, title, mode)

    return NextResponse.json({ thread }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create thread error:", error)
    return NextResponse.json({ error: error.message || "Failed to create thread" }, { status: 500 })
  }
}
