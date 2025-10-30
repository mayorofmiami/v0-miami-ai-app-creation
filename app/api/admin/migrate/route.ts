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

    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id)
    `

    await sql`
      CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `

    await sql`
      DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts
    `

    await sql`
      CREATE TRIGGER blog_posts_updated_at
        BEFORE UPDATE ON blog_posts
        FOR EACH ROW
        EXECUTE FUNCTION update_blog_posts_updated_at()
    `

    return NextResponse.json({
      success: true,
      message:
        "Migration completed successfully! OAuth support, model_usage table, and blog_posts table have been created.",
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
