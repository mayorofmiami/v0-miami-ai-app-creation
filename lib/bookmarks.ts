import { neon } from "@neondatabase/serverless"
import { logger } from "./logger"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function addBookmark(userId: string, searchId: string) {
  try {
    const id = crypto.randomUUID()
    await sql`
      INSERT INTO bookmarks (id, user_id, search_id)
      VALUES (${id}, ${userId}, ${searchId})
      ON CONFLICT (user_id, search_id) DO NOTHING
    `
    return { success: true }
  } catch (error) {
    logger.error("Add bookmark error:", error)
    return { success: false, error: "Failed to add bookmark" }
  }
}

export async function removeBookmark(userId: string, searchId: string) {
  try {
    await sql`
      DELETE FROM bookmarks
      WHERE user_id = ${userId} AND search_id = ${searchId}
    `
    return { success: true }
  } catch (error) {
    logger.error("Remove bookmark error:", error)
    return { success: false, error: "Failed to remove bookmark" }
  }
}

export async function getBookmarks(userId: string) {
  try {
    const result = await sql`
      SELECT 
        sh.id,
        sh.query,
        sh.response,
        sh.model,
        sh.created_at,
        b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN search_history sh ON b.search_id = sh.id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `
    return result
  } catch (error) {
    logger.error("Get bookmarks error:", error)
    return []
  }
}

export async function isBookmarked(userId: string, searchId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM bookmarks
      WHERE user_id = ${userId} AND search_id = ${searchId}
    `
    return result.length > 0
  } catch (error) {
    logger.error("Check bookmark error:", error)
    return false
  }
}
