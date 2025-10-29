import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: Date
  search_count?: number
}

export async function createCollection(userId: string, name: string, description?: string) {
  const result = await sql`
    INSERT INTO collections (user_id, name, description)
    VALUES (${userId}, ${name}, ${description || null})
    RETURNING *
  `
  return result[0] as Collection
}

export async function getUserCollections(userId: string) {
  const collections = await sql`
    SELECT 
      c.*,
      COUNT(cs.search_id) as search_count
    FROM collections c
    LEFT JOIN collection_searches cs ON c.id = cs.collection_id
    WHERE c.user_id = ${userId}
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `
  return collections as Collection[]
}

export async function addSearchToCollection(collectionId: string, searchId: string) {
  await sql`
    INSERT INTO collection_searches (collection_id, search_id)
    VALUES (${collectionId}, ${searchId})
    ON CONFLICT DO NOTHING
  `
}

export async function removeSearchFromCollection(collectionId: string, searchId: string) {
  await sql`
    DELETE FROM collection_searches
    WHERE collection_id = ${collectionId} AND search_id = ${searchId}
  `
}

export async function getCollectionSearches(collectionId: string) {
  const searches = await sql`
    SELECT sh.*
    FROM search_history sh
    JOIN collection_searches cs ON sh.id = cs.search_id
    WHERE cs.collection_id = ${collectionId}
    ORDER BY cs.added_at DESC
  `
  return searches
}

export async function deleteCollection(collectionId: string) {
  await sql`DELETE FROM collections WHERE id = ${collectionId}`
}
