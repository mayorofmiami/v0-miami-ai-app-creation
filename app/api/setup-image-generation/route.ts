import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Creating generated_images table...")

    // Create the generated_images table
    await sql`
      CREATE TABLE IF NOT EXISTS generated_images (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        model_used TEXT NOT NULL,
        resolution TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT
      )
    `

    console.log("[v0] Creating indexes...")

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_images_user_id 
      ON generated_images(user_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_images_created_at 
      ON generated_images(created_at)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_images_ip_address 
      ON generated_images(ip_address)
    `

    console.log("[v0] Setup completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Image generation database setup completed successfully",
    })
  } catch (error: any) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
