import { redis } from "@/lib/redis"
import { nanoid } from "nanoid"
import { getSearchById } from "@/lib/db"

export interface ShareData {
  query: string
  response: string
  userId?: string
  createdAt: number
  views: number
}

export async function createDirectShareLink(query: string, response: string, userId?: string) {
  try {
    const shareId = nanoid(10)
    const shareData: ShareData = {
      query,
      response,
      userId,
      createdAt: Date.now(),
      views: 0,
    }

    // Store in Redis with 30-day expiry
    await redis.setex(`share:${shareId}`, 60 * 60 * 24 * 30, JSON.stringify(shareData))

    console.log("[v0] Created direct share link:", shareId)
    return { success: true, shareToken: shareId }
  } catch (error) {
    console.error("[v0] Create direct share link error:", error)
    return { success: false, error: "Failed to create share link" }
  }
}
// </CHANGE>

export async function getSharedSearch(shareId: string) {
  try {
    // First check Redis for direct shares
    const redisData = await redis.get(`share:${shareId}`)

    if (redisData) {
      const data = typeof redisData === "string" ? JSON.parse(redisData) : redisData

      // Increment view count
      data.views = (data.views || 0) + 1
      await redis.setex(`share:${shareId}`, 60 * 60 * 24 * 30, JSON.stringify(data))

      return { success: true, data }
    }

    // Fallback to database for saved searches
    const dbSearch = await getSearchById(shareId)

    if (dbSearch) {
      return {
        success: true,
        data: {
          query: dbSearch.query,
          response: dbSearch.response,
          createdAt: new Date(dbSearch.timestamp).getTime(),
          views: 0,
        },
      }
    }

    return { success: false, error: "Share not found" }
  } catch (error) {
    console.error("[v0] Get shared search error:", error)
    return { success: false, error: "Failed to retrieve share" }
  }
}
// </CHANGE>

export async function createShareLink(searchId: string) {
  try {
    const search = await getSearchById(searchId)

    if (!search) {
      return { success: false, error: "Search not found" }
    }

    const shareId = nanoid(10)
    const shareData: ShareData = {
      query: search.query,
      response: search.response,
      createdAt: new Date(search.timestamp).getTime(),
      views: 0,
    }

    // Store in Redis with 30-day expiry
    await redis.setex(`share:${shareId}`, 60 * 60 * 24 * 30, JSON.stringify(shareData))

    return { success: true, shareToken: shareId }
  } catch (error) {
    console.error("[v0] Create share link error:", error)
    return { success: false, error: "Failed to create share link" }
  }
}
// </CHANGE>
