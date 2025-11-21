import { getCurrentUser } from "@/lib/auth"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    logger.error("Error fetching current user", { error })
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
