import { NextRequest, NextResponse } from "next/server"
import { createPasswordResetToken } from "@/lib/auth"

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
      console.log(`[v0] Password reset link: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${result.token}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Forgot password error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
