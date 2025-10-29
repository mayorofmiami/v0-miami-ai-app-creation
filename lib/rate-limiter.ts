import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env["UPSTASH-KV_KV_REST_API_URL"] || "",
  token: process.env["UPSTASH-KV_KV_REST_API_TOKEN"] || "",
})

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// Model-specific rate limits
export const MODEL_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Expensive models - stricter limits for free users
  "openai/gpt-4o": { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  "anthropic/claude-3.5-sonnet": { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour

  // Medium cost models
  "anthropic/claude-3.5-haiku": { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  "openai/gpt-4o-mini": { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour

  // Cheap models - more generous limits
  "google/gemini-2.0-flash": { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  "groq/llama-3.1-8b": { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  "groq/llama-3.3-70b": { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
}

export async function checkRateLimit(
  userId: string,
  model: string,
  userTier: "free" | "pro" = "free",
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Pro users bypass rate limits
  if (userTier === "pro") {
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60 * 60 * 1000 }
  }

  const config = MODEL_RATE_LIMITS[model]
  if (!config) {
    // No rate limit configured for this model
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60 * 60 * 1000 }
  }

  const key = `ratelimit:${userId}:${model}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  try {
    // Get current count
    const count = (await redis.get<number>(key)) || 0

    if (count >= config.maxRequests) {
      const ttl = await redis.ttl(key)
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + ttl * 1000,
      }
    }

    // Increment count
    await redis.incr(key)
    await redis.expire(key, Math.floor(config.windowMs / 1000))

    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      resetAt: now + config.windowMs,
    }
  } catch (error) {
    console.error("[v0] Rate limit check error:", error)
    // On error, allow the request
    return { allowed: true, remaining: 999, resetAt: now + 60 * 60 * 1000 }
  }
}
