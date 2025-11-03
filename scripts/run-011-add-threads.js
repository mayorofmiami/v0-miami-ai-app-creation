import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import { join } from "path"

const sql = neon(process.env.DATABASE_URL)

async function runMigration() {
  try {
    console.log("Running threads migration...")

    const migrationSQL = readFileSync(join(process.cwd(), "scripts", "011-add-threads.sql"), "utf-8")

    await sql(migrationSQL)

    console.log("✅ Threads migration completed successfully!")
    return { success: true }
  } catch (error) {
    console.error("❌ Migration failed:", error)
    return { success: false, error: error.message }
  }
}

runMigration()
