import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { logger } from "@/lib/logger"
import { clearConfigCache } from "@/lib/unified-rate-limit"

// DELETE a rate limit config
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const deleted = await sql`
      DELETE FROM rate_limit_configs
      WHERE id = ${id}
      RETURNING *
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    clearConfigCache()

    logger.info("Rate limit config deleted", {
      configId: id,
      adminUser: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error("Failed to delete rate limit config", { error: error?.message || error })
    return NextResponse.json({ error: "Failed to delete config" }, { status: 500 })
  }
}
