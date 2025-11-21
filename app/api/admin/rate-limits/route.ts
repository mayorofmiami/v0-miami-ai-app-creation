import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { logger } from "@/lib/logger"
import { clearConfigCache } from "@/lib/unified-rate-limit"

// GET all rate limit configs
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const configs = await sql`
      SELECT 
        id,
        config_key,
        config_type,
        max_requests,
        window_seconds,
        applies_to,
        description,
        is_active,
        created_at,
        updated_at
      FROM rate_limit_configs
      ORDER BY config_type, config_key
    `

    return NextResponse.json(
      { configs },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      },
    )
  } catch (error: any) {
    logger.error("Failed to fetch rate limit configs", { error: error?.message || error })
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 })
  }
}

// PUT update a rate limit config
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, max_requests, window_seconds, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Config ID required" }, { status: 400 })
    }

    const updated = await sql`
      UPDATE rate_limit_configs
      SET 
        max_requests = COALESCE(${max_requests}, max_requests),
        window_seconds = COALESCE(${window_seconds}, window_seconds),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (updated.length === 0) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    // Clear the cache so new values take effect immediately
    clearConfigCache()

    logger.info("Rate limit config updated", {
      configId: id,
      adminUser: user.id,
      changes: { max_requests, window_seconds, is_active },
    })

    return NextResponse.json({ config: updated[0] })
  } catch (error: any) {
    logger.error("Failed to update rate limit config", { error: error?.message || error })
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}

// POST create a new rate limit config
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { config_key, config_type, max_requests, window_seconds, applies_to, description } = await request.json()

    if (!config_key || !config_type || !max_requests || !window_seconds || !applies_to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const created = await sql`
      INSERT INTO rate_limit_configs (config_key, config_type, max_requests, window_seconds, applies_to, description)
      VALUES (${config_key}, ${config_type}, ${max_requests}, ${window_seconds}, ${applies_to}, ${description || null})
      RETURNING *
    `

    clearConfigCache()

    logger.info("Rate limit config created", {
      configKey: config_key,
      adminUser: user.id,
    })

    return NextResponse.json({ config: created[0] })
  } catch (error: any) {
    logger.error("Failed to create rate limit config", { error: error?.message || error })
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 })
  }
}
