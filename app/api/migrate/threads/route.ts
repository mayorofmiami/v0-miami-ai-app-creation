import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Running threads migration...")

    await sql`
-- Add threads table for conversation management
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT,
  mode TEXT DEFAULT 'quick',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE
);`

    await sql`
-- Add thread_id column to search_history
ALTER TABLE search_history 
ADD COLUMN IF NOT EXISTS thread_id TEXT REFERENCES threads(id) ON DELETE CASCADE;`

    await sql`
ALTER TABLE search_history 
ADD COLUMN IF NOT EXISTS position_in_thread INTEGER DEFAULT 0;`

    await sql`
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);`

    await sql`
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);`

    await sql`
CREATE INDEX IF NOT EXISTS idx_search_history_thread_id ON search_history(thread_id);`

    await sql`
CREATE INDEX IF NOT EXISTS idx_search_history_thread_position ON search_history(thread_id, position_in_thread);`

    await sql`
-- Create function to auto-update thread updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE threads 
  SET updated_at = NOW() 
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`

    await sql`
-- Create trigger to update thread timestamp when search is added
DROP TRIGGER IF EXISTS update_thread_on_search ON search_history;`

    await sql`
CREATE TRIGGER update_thread_on_search
AFTER INSERT ON search_history
FOR EACH ROW
WHEN (NEW.thread_id IS NOT NULL)
EXECUTE FUNCTION update_thread_timestamp();`

    console.log("[v0] Threads migration completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Threads table created successfully with indexes and triggers",
    })
  } catch (error: any) {
    console.error("[v0] Threads migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create threads table",
      },
      { status: 500 },
    )
  }
}
