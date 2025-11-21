import { Redis } from "@upstash/redis"
import { logger } from "./logger"

// Initialize Redis client
const redis = new Redis({
  url: process.env["UPSTASH-KV_KV_REST_API_URL"] || "",
  token: process.env["UPSTASH-KV_KV_REST_API_TOKEN"] || "",
})

export interface CachedResponse {
  answer: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  model: string
  timestamp: number
}

// Generate cache key from query and mode
export function getCacheKey(query: string, mode: "quick" | "deep"): string {
  const normalized = query.toLowerCase().trim()
  return `search:${mode}:${normalized}`
}

// Get cached response
export async function getCachedResponse(query: string, mode: "quick" | "deep"): Promise<CachedResponse | null> {
  try {
    const key = getCacheKey(query, mode)
    logger.debug("Attempting to get cache", { key })
    const cached = await redis.get<CachedResponse>(key)
    logger.debug("Cache result", {
      found: !!cached,
      answerLength: cached?.answer?.length,
    })

    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      if (age < maxAge) {
        logger.info("Cache hit", { query })
        return cached
      } else {
        logger.info("Cache expired", { query })
      }
    }

    return null
  } catch (error) {
    logger.error("Cache get error", { error })
    return null
  }
}

// Set cached response
export async function setCachedResponse(
  query: string,
  mode: "quick" | "deep",
  response: Omit<CachedResponse, "timestamp">,
): Promise<void> {
  try {
    const key = getCacheKey(query, mode)
    const cached: CachedResponse = {
      ...response,
      timestamp: Date.now(),
    }

    await redis.setex(key, 24 * 60 * 60, cached)
    logger.info("Saved response to cache", { query })
  } catch (error) {
    logger.error("Cache set error", { error })
  }
}

// Clear cache for a specific query
export async function clearCache(query: string, mode: "quick" | "deep"): Promise<void> {
  try {
    const key = getCacheKey(query, mode)
    await redis.del(key)
  } catch (error) {
    logger.error("Cache clear error", { error })
  }
}
