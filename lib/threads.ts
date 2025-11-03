import "server-only"
import { sql } from "./db"

export interface Thread {
  id: string
  user_id: string
  title: string | null
  mode: "quick" | "deep"
  created_at: string
  updated_at: string
  search_count?: number
  last_query?: string
}

export interface ThreadWithSearches extends Thread {
  searches: Array<{
    id: string
    query: string
    response: string
    citations: any
    created_at: string
    position_in_thread: number
  }>
}

/**
 * Create a new thread
 */
export async function createThread(userId: string, title?: string, mode: "quick" | "deep" = "quick"): Promise<Thread> {
  const result = await sql`
    INSERT INTO threads (user_id, title, mode)
    VALUES (${userId}, ${title || null}, ${mode})
    RETURNING *
  `
  return result[0] as Thread
}

/**
 * Get all threads for a user
 */
export async function getUserThreads(userId: string, limit = 50): Promise<Thread[]> {
  const result = await sql`
    SELECT 
      t.*,
      COUNT(sh.id) as search_count,
      (
        SELECT sh2.query 
        FROM search_history sh2 
        WHERE sh2.thread_id = t.id 
        ORDER BY sh2.position_in_thread DESC 
        LIMIT 1
      ) as last_query
    FROM threads t
    LEFT JOIN search_history sh ON t.id = sh.thread_id
    WHERE t.user_id = ${userId}
    GROUP BY t.id
    ORDER BY t.updated_at DESC
    LIMIT ${limit}
  `
  return result as Thread[]
}

/**
 * Get a single thread with all its searches
 */
export async function getThread(threadId: string, userId: string): Promise<ThreadWithSearches | null> {
  const threadResult = await sql`
    SELECT * FROM threads
    WHERE id = ${threadId} AND user_id = ${userId}
  `

  if (threadResult.length === 0) return null

  const thread = threadResult[0] as Thread

  const searches = await sql`
    SELECT id, query, response, citations, created_at, position_in_thread
    FROM search_history
    WHERE thread_id = ${threadId}
    ORDER BY position_in_thread ASC
  `

  return {
    ...thread,
    searches: searches as any[],
  }
}

/**
 * Update thread title
 */
export async function updateThreadTitle(threadId: string, userId: string, title: string): Promise<Thread | null> {
  const result = await sql`
    UPDATE threads
    SET title = ${title}, updated_at = NOW()
    WHERE id = ${threadId} AND user_id = ${userId}
    RETURNING *
  `
  return result.length > 0 ? (result[0] as Thread) : null
}

/**
 * Delete a thread (cascades to searches)
 */
export async function deleteThread(threadId: string, userId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM threads
    WHERE id = ${threadId} AND user_id = ${userId}
    RETURNING id
  `
  return result.length > 0
}

/**
 * Add a search to a thread
 */
export async function addSearchToThread(searchId: string, threadId: string): Promise<void> {
  // Get the next position in the thread
  const positionResult = await sql`
    SELECT COALESCE(MAX(position_in_thread), -1) + 1 as next_position
    FROM search_history
    WHERE thread_id = ${threadId}
  `
  const nextPosition = positionResult[0].next_position

  await sql`
    UPDATE search_history
    SET thread_id = ${threadId}, position_in_thread = ${nextPosition}
    WHERE id = ${searchId}
  `
}

/**
 * Generate a title for a thread based on its first search
 */
export async function generateThreadTitle(threadId: string): Promise<string> {
  const result = await sql`
    SELECT query FROM search_history
    WHERE thread_id = ${threadId}
    ORDER BY position_in_thread ASC
    LIMIT 1
  `

  if (result.length === 0) return "New Thread"

  const query = result[0].query as string
  // Truncate to 50 characters and add ellipsis if needed
  return query.length > 50 ? query.substring(0, 47) + "..." : query
}

/**
 * Auto-generate and update thread title
 */
export async function autoUpdateThreadTitle(threadId: string, userId: string): Promise<void> {
  const title = await generateThreadTitle(threadId)
  await updateThreadTitle(threadId, userId, title)
}
