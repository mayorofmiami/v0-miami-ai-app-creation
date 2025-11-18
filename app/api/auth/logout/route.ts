import { NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Logout request received")
    
    // Delete session from database and clear cookie
    await logout()
    
    console.log("[v0] Session deleted successfully")
    
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    )
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to log out" },
      { status: 500 }
    )
  }
}
