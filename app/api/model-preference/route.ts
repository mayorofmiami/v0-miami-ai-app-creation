import { type NextRequest, NextResponse } from "next/server"
import { getModelPreference, updateModelPreference } from "@/lib/db"
import { initializeDatabase } from "@/lib/db-init"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const preference = await getModelPreference(userId)

    return NextResponse.json(
      { preference },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error) {
    logger.error("Error fetching model preference", { error })
    return NextResponse.json({ error: "Failed to fetch model preference" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const body = await request.json()
    const { userId, modelPreference, selectedModel } = body

    if (!userId || !modelPreference) {
      return NextResponse.json({ error: "User ID and model preference are required" }, { status: 400 })
    }

    const preference = await updateModelPreference(userId, modelPreference, selectedModel)

    return NextResponse.json(
      { preference },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  } catch (error) {
    logger.error("Error updating model preference", { error })
    return NextResponse.json({ error: "Failed to update model preference" }, { status: 500 })
  }
}
