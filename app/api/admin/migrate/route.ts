import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    await sql`
      ALTER TABLE users 
      ALTER COLUMN password_hash DROP NOT NULL
    `

    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS oauth_provider TEXT,
      ADD COLUMN IF NOT EXISTS oauth_id TEXT,
      ADD COLUMN IF NOT EXISTS avatar_url TEXT
    `

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth 
      ON users(oauth_provider, oauth_id) 
      WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL
    `

    await sql`
      CREATE TABLE IF NOT EXISTS model_usage (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_model_usage_created_at ON model_usage(created_at DESC)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage(model)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_model_usage_user_id ON model_usage(user_id)
    `

    return NextResponse.json({
      success: true,
      message:
        "Migration completed successfully! OAuth support has been added and the model_usage table has been created.",
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
