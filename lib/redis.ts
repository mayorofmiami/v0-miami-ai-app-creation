import { Redis } from "@upstash/redis"
import type { Citation } from "@/types"
import { logger } from "./logger"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

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
    logger.error("Cache set error", { error })
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
    logger.error("Cache get error", { error })
    return null
  }
}

/**
 * @deprecated Use checkGlobalRateLimit from @/lib/unified-rate-limit instead
 * This function is kept for backward compatibility but will be removed in future versions.
 * The new unified rate limiting system provides database-backed configuration through the admin panel.
 */
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
    logger.error("Rate limit error", { error })
    return { allowed: true, remaining: limit }
  }
}

// Clear user cache
export async function clearUserCache(userId: string) {
  try {
    const key = CACHE_KEYS.userSearches(userId)
    await redis.del(key)
  } catch (error) {
    logger.error("Cache clear error", { error })
  }
}

export async function getOrFetchWebSearch(query: string, fetcher: () => Promise<any>) {
  try {
    const key = `websearch:${query}`
    const cached = await redis.get(key)

    if (cached) {
      logger.info("Using cached web search results", { query })
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
    logger.error("Web search cache error", { error })
    return fetcher()
  }
}

export async function getCachedResponse(query: string, mode: string) {
  try {
    const key = `search:${mode}:${query}`
    const cached = await redis.get(key)
    if (cached) {
      if (typeof cached === "string") {
        return JSON.parse(cached)
      }
      return cached
    }
    return null
  } catch (error) {
    logger.error("Cache get error", { error })
    return null
  }
}

export async function setCachedResponse(
  query: string,
  mode: string,
  data: { answer: string; sources: any[]; model: string },
) {
  try {
    const key = `search:${mode}:${query}`
    await redis.setex(key, 60 * 60 * 24, JSON.stringify({ ...data, cachedAt: Date.now() }))
  } catch (error) {
    logger.error("Cache set error", { error })
  }
}

export async function trackModelUsage(userId: string | null, model: string, inputTokens: number, outputTokens: number) {
  if (!userId) return

  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Simple cost estimation (approximate)
    const costPerMillionInput = 0.5 // $0.50 per million tokens (average)
    const costPerMillionOutput = 1.5 // $1.50 per million tokens (average)
    const cost = (inputTokens / 1_000_000) * costPerMillionInput + (outputTokens / 1_000_000) * costPerMillionOutput

    await sql`
      INSERT INTO model_usage (user_id, model, input_tokens, output_tokens, cost, created_at)
      VALUES (${userId}, ${model}, ${inputTokens}, ${outputTokens}, ${cost}, NOW())
    `
  } catch (error) {
    logger.error("Failed to track model usage", { error })
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return "unknown"
}
