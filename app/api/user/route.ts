import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    console.log("[v0] /api/user GET request - checking authentication")

    const user = await getCurrentUser()

    if (user) {
      console.log("[v0] User authenticated:", user.email, "role:", user.role)
    } else {
      console.log("[v0] No authenticated user found")
    }

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
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] /api/user error:", error)
    return NextResponse.json({ error: "Failed to get user", user: null }, { status: 500 })
  }
}
