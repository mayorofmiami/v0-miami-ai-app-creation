import { type NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    // Delete session from database and clear cookie
    await logout()

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    logger.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Failed to log out" }, { status: 500 })
  }
}
