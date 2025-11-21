import { type NextRequest, NextResponse } from "next/server"
import { resetPassword } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 })
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const result = await resetPassword(token, password)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Reset password error", { error })
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
