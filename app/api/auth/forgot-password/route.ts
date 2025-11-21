import { type NextRequest, NextResponse } from "next/server"
import { createPasswordResetToken } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const result = await createPasswordResetToken(email)

    if (result.success && result.token) {
      // In production, send an email with the reset link
      // For now, we'll just return success (security best practice: don't reveal if email exists)
      logger.info("Password reset token generated", { email })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Forgot password error", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
