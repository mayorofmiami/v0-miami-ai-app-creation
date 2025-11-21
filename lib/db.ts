import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

// Helper to get user ID (from Stack Auth or IP for anonymous)
export function getUserIdentifier(userId?: string | null, ipAddress?: string): string {
  return userId || ipAddress || "anonymous"
}

export async function createThread(userId: string, title: string) {
  const result = await sql`
    INSERT INTO threads (user_id, title, created_at, updated_at)
    VALUES (${userId}, ${title}, NOW(), NOW())
    RETURNING id, user_id, title, created_at, updated_at
  `
  return result[0]
}

export async function generateThreadTitle(query: string): Promise<string> {
  // Simple title generation - take first 50 chars or generate from query
  const title = query.length > 50 ? query.slice(0, 50) + "..." : query
  return title
}

export async function getUserThreads(userId: string, limit = 20) {
  const threads = await sql`
    SELECT id, user_id, title, created_at, updated_at
    FROM threads
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `
  return threads
}

export async function saveSearchToHistory(
  userId: string,
  threadId: string,
  query: string,
  mode: string,
  response: string,
) {
  const result = await sql`
    INSERT INTO search_history (user_id, thread_id, query, response, model, created_at)
    VALUES (${userId}, ${threadId}, ${query}, ${response}, 'auto', NOW())
    RETURNING id
  `
  return result[0]?.id
}

export async function getSearchHistory(userId: string, limit = 50) {
  const history = await sql`
    SELECT id, thread_id, query, response, model, created_at
    FROM search_history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return history
}

export async function updateSearchResponse(searchId: string, response: string) {
  await sql`
    UPDATE search_history
    SET response = ${response}
    WHERE id = ${searchId}
  `
}

export async function getModelPreference(userId: string) {
  const result = await sql`
    SELECT preferred_model
    FROM user_preferences
    WHERE user_id = ${userId}
  `
  return result[0]?.preferred_model || null
}

export async function setModelPreference(userId: string, model: string) {
  await sql`
    INSERT INTO user_preferences (user_id, preferred_model)
    VALUES (${userId}, ${model})
    ON CONFLICT (user_id) 
    DO UPDATE SET preferred_model = ${model}
  `
}

export async function getBookmarks(userId: string) {
  // TODO: Implement bookmarks table and functionality
  return []
}

export async function getThreadMessages(threadId: string) {
  const messages = await sql`
    SELECT id, thread_id, query, response, model, created_at
    FROM search_history
    WHERE thread_id = ${threadId}
    ORDER BY created_at ASC
  `
  return messages
}

export async function deleteThread(threadId: string, userId: string) {
  try {
    // Verify thread belongs to user
    const thread = await sql`
      SELECT user_id FROM threads WHERE id = ${threadId}
    `

    if (thread.length === 0 || thread[0].user_id !== userId) {
      return { success: false, error: "Thread not found or unauthorized" }
    }

    // Delete thread and cascade to search history
    await sql`DELETE FROM threads WHERE id = ${threadId}`

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete thread" }
  }
}
