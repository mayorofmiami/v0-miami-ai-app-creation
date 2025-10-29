import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function createShareLink(searchId: string, expiresInDays = 30) {
  try {
    const id = crypto.randomUUID()
    // Generate random token using Web Crypto API
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    const shareToken = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO shared_searches (id, search_id, share_token, expires_at)
      VALUES (${id}, ${searchId}, ${shareToken}, ${expiresAt.toISOString()})
    `

    return { success: true, shareToken }
  } catch (error) {
    console.error("[v0] Create share link error:", error)
    return { success: false, error: "Failed to create share link" }
  }
}

export async function getSharedSearch(shareToken: string) {
  try {
    const result = await sql`
      SELECT 
        sh.id,
        sh.query,
        sh.response,
        sh.citations,
        sh.mode,
        sh.created_at,
        ss.view_count
      FROM shared_searches ss
      JOIN search_history sh ON ss.search_id = sh.id
      WHERE ss.share_token = ${shareToken}
      AND (ss.expires_at IS NULL OR ss.expires_at > NOW())
    `

    if (result.length === 0) return null

    // Increment view count
    await sql`
      UPDATE shared_searches
      SET view_count = view_count + 1
      WHERE share_token = ${shareToken}
    `

    return result[0]
  } catch (error) {
    console.error("[v0] Get shared search error:", error)
    return null
  }
}
