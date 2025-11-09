import { Redis } from "@upstash/redis"
import type { Citation } from "@/types"

// Initialize Redis client with Upstash
export const redis = new Redis({
  url: process.env["UPSTASH-KV_KV_REST_API_URL"]!,
  token: process.env["UPSTASH-KV_KV_REST_API_TOKEN"]!,
})

// Cache keys
export const CACHE_KEYS = {
  search: (query: string, mode: string) => `search:${mode}:${query}`,
  userSearches: (userId: string) => `user:${userId}:searches`,
  rateLimit: (userId: string) => `ratelimit:${userId}`,
}

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  search: 60 * 60 * 24, // 24 hours
  userSearches: 60 * 5, // 5 minutes
  rateLimit: 60 * 60 * 24, // 24 hours
}

// Cache search results
export async function cacheSearchResult(query: string, mode: string, response: string, citations: Citation[]) {
  try {
    const key = CACHE_KEYS.search(query, mode)
    await redis.setex(key, CACHE_TTL.search, JSON.stringify({ response, citations, cachedAt: Date.now() }))
  } catch (error) {
    console.error("[v0] Cache set error:", error)
  }
}

// Get cached search result
export async function getCachedSearchResult(query: string, mode: string) {
  try {
    const key = CACHE_KEYS.search(query, mode)
    const cached = await redis.get(key)
    if (cached) {
      // Upstash Redis may return already-parsed objects
      if (typeof cached === "string") {
        return JSON.parse(cached)
      }
      return cached
    }
    return null
  } catch (error) {
    console.error("[v0] Cache get error:", error)
    return null
  }
}

// Rate limiting
export async function checkRateLimit(userId: string, limit = 100): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const key = CACHE_KEYS.rateLimit(userId)
    const current = await redis.get(key)

    if (!current) {
      await redis.setex(key, CACHE_TTL.rateLimit, 1)
      return { allowed: true, remaining: limit - 1 }
    }

    const count = Number.parseInt(current as string, 10)

    if (count >= limit) {
      return { allowed: false, remaining: 0 }
    }

    await redis.incr(key)
    return { allowed: true, remaining: limit - count - 1 }
  } catch (error) {
    console.error("[v0] Rate limit error:", error)
    return { allowed: true, remaining: limit }
  }
}

// Clear user cache
export async function clearUserCache(userId: string) {
  try {
    const key = CACHE_KEYS.userSearches(userId)
    await redis.del(key)
  } catch (error) {
    console.error("[v0] Cache clear error:", error)
  }
}

export async function getOrFetchWebSearch(query: string, fetcher: () => Promise<any>) {
  try {
    const key = `websearch:${query}`
    const cached = await redis.get(key)

    if (cached) {
      console.log("[v0] Using cached web search results")
      if (typeof cached === "string") {
        return JSON.parse(cached)
      }
      return cached
    }

    // Fetch fresh results
    const results = await fetcher()

    // Cache for 1 hour (deduplicate across users)
    await redis.setex(key, 60 * 60, JSON.stringify(results))

    return results
  } catch (error) {
    console.error("[v0] Web search cache error:", error)
    // Fallback to fetching without cache
    return fetcher()
  }
}
