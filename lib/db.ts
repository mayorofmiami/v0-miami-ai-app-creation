import { neon } from "@neondatabase/serverless"

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  (process.env.NEON_PROJECT_ID
    ? `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DATABASE}?sslmode=require`
    : "postgresql://neondb_owner:npg_ElDWVs16TUbz@ep-square-salad-ad5paw94-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require")

export const sql = neon(DATABASE_URL)

export async function getSearchHistory(userId: string, limit = 50) {
  const results = await sql`
    SELECT id, query, response, created_at, thread_id, model
    FROM search_history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return results
}

export async function getModelPreference(userId: string) {
  const results = await sql`
    SELECT preferred_model
    FROM model_preferences
    WHERE user_id = ${userId}
  `
  return results[0] || { preferred_model: null }
}

export async function updateModelPreference(userId: string, model: string) {
  await sql`
    INSERT INTO model_preferences (user_id, preferred_model, created_at, updated_at)
    VALUES (${userId}, ${model}, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET preferred_model = ${model}, updated_at = NOW()
  `
}

export async function saveSearchHistory(
  userId: string,
  query: string,
  response: string,
  threadId: string | null,
  model: string,
) {
  const results = await sql`
    INSERT INTO search_history (user_id, query, response, thread_id, model, created_at)
    VALUES (${userId}, ${query}, ${response}, ${threadId}, ${model}, NOW())
    RETURNING id
  `
  return results[0]
}

export async function getThread(threadId: string, userId: string) {
  const results = await sql`
    SELECT * FROM threads
    WHERE id = ${threadId} AND user_id = ${userId}
  `
  return results[0]
}

export async function createThread(userId: string, title: string) {
  const results = await sql`
    INSERT INTO threads (user_id, title, created_at, updated_at)
    VALUES (${userId}, ${title}, NOW(), NOW())
    RETURNING *
  `
  return results[0]
}

export async function updateThread(threadId: string, userId: string, title: string) {
  await sql`
    UPDATE threads
    SET title = ${title}, updated_at = NOW()
    WHERE id = ${threadId} AND user_id = ${userId}
  `
}

export async function deleteThread(threadId: string, userId: string) {
  await sql`
    DELETE FROM threads
    WHERE id = ${threadId} AND user_id = ${userId}
  `
}
