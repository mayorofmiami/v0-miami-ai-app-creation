import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getSearchHistory, getModelPreference } from "@/lib/db"
import { initializeDatabase } from "@/lib/db-init"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    await initializeDatabase()

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          user: null,
          history: [],
          modelPreference: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    const [history, modelPreference] = await Promise.all([getSearchHistory(user.id, 50), getModelPreference(user.id)])

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "user",
        },
        history,
        modelPreference,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    logger.error("/api/init error", { error })
    return NextResponse.json(
      {
        error: "Failed to initialize",
        user: null,
        history: [],
        modelPreference: null,
      },
      { status: 500 },
    )
  }
}
