import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const user = await getCurrentUser()

    return NextResponse.json(
      {
        user: user
          ? {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || "user",
            }
          : null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    logger.error("/api/user error", { error })
    return NextResponse.json({ error: "Failed to get user", user: null }, { status: 500 })
  }
}
