import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Running auth constraints fix migration...")

    // Remove foreign key constraints
    await sql`ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_user_id_fkey`
    await sql`ALTER TABLE search_history DROP CONSTRAINT IF EXISTS search_history_user_id_fkey`
    await sql`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey`
    await sql`ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey`
    await sql`ALTER TABLE model_preferences DROP CONSTRAINT IF EXISTS model_preferences_user_id_fkey`

    console.log("[v0] Auth constraints fix migration completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Foreign key constraints removed. App now works with Stack Auth.",
    })
  } catch (error: any) {
    console.error("[v0] Auth constraints fix migration error:", error?.message || error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Migration failed",
      },
      { status: 500 },
    )
  }
}
