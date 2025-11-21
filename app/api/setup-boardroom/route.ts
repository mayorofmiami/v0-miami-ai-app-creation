import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    logger.info("Creating boardroom tables...")

    await sql`
      CREATE TABLE IF NOT EXISTS board_sessions (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        board_type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'in_progress',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    logger.info("board_sessions table created")

    await sql`
      CREATE TABLE IF NOT EXISTS board_responses (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES board_sessions(id) ON DELETE CASCADE,
        persona_name VARCHAR(100) NOT NULL,
        persona_model VARCHAR(50) NOT NULL,
        round_number INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    logger.info("board_responses table created")

    await sql`
      CREATE TABLE IF NOT EXISTS board_votes (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES board_sessions(id) ON DELETE CASCADE,
        response_id TEXT NOT NULL REFERENCES board_responses(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        vote_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(response_id, user_id)
      )
    `
    logger.info("board_votes table created")

    await sql`CREATE INDEX IF NOT EXISTS idx_board_sessions_user ON board_sessions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_board_sessions_thread ON board_sessions(thread_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_board_responses_session ON board_responses(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_board_votes_session ON board_votes(session_id)`
    logger.info("Indexes created")

    return NextResponse.json({
      success: true,
      message:
        "✅ Boardroom tables created successfully! You can now use Boardroom Mode. Refresh the page and click the + icon in the search box to find the Boardroom Mode option.",
    })
  } catch (error: any) {
    logger.error("Boardroom setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: "If the error says tables already exist, that's fine - just try using Boardroom Mode now!",
      },
      { status: 200 },
    )
  }
}
