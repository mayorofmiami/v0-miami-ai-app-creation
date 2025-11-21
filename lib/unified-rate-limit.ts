import "server-only"
import { neon } from "@neondatabase/serverless"
import { logger } from "./logger"

const sql = neon(process.env.DATABASE_URL!)

export interface RateLimitConfig {
  id: string
  config_key: string
  config_type: "global" | "model" | "feature"
  max_requests: number
  window_seconds: number
  applies_to: "all" | "free" | "authenticated" | "pro"
  description: string | null
  is_active: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: number
  reason?: string
}

// Cache for rate limit configs (in-memory, 5 min TTL)
let configCache: { data: RateLimitConfig[]; timestamp: number } | null = null
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CachedRateLimit {
  count: number
  limit: number
  resetAt: number
  cachedAt: number
}

const rateLimitCache = new Map<string, CachedRateLimit>()
const RATE_LIMIT_CACHE_TTL = 30 * 1000 // 30 seconds

setInterval(
  () => {
    const now = Date.now()
    for (const [key, value] of rateLimitCache.entries()) {
      if (now - value.cachedAt > RATE_LIMIT_CACHE_TTL * 2) {
        rateLimitCache.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

async function getRateLimitConfigs(): Promise<RateLimitConfig[]> {
  if (configCache && Date.now() - configCache.timestamp < CONFIG_CACHE_TTL) {
    return configCache.data
  }

  try {
    const configs = await sql`
      SELECT id, config_key, config_type, max_requests, window_seconds, applies_to, description, is_active FROM rate_limit_configs
      WHERE is_active = true
      ORDER BY config_type, config_key
    `

    const typedConfigs = configs as RateLimitConfig[]
    configCache = { data: typedConfigs, timestamp: Date.now() }
    return typedConfigs
  } catch (error: any) {
    if (error?.code !== "42P01") {
      logger.error("Failed to fetch rate limit configs", { error })
    }
    return []
  }
}

function getUserTier(userId: string | null, isPro: boolean): "free" | "authenticated" | "pro" {
  if (isPro) return "pro"
  if (userId) return "authenticated"
  return "free"
}

async function getConfig(configKey: string): Promise<RateLimitConfig | null> {
  const configs = await getRateLimitConfigs()
  return configs.find((c) => c.config_key === configKey) || null
}

function getCachedRateLimit(cacheKey: string): CachedRateLimit | null {
  const cached = rateLimitCache.get(cacheKey)
  if (!cached) return null

  const now = Date.now()

  // Cache expired
  if (now - cached.cachedAt > RATE_LIMIT_CACHE_TTL) {
    rateLimitCache.delete(cacheKey)
    return null
  }

  // Window expired, reset count
  if (now > cached.resetAt) {
    rateLimitCache.delete(cacheKey)
    return null
  }

  return cached
}

function setCachedRateLimit(cacheKey: string, count: number, limit: number, resetAt: number): void {
  rateLimitCache.set(cacheKey, {
    count,
    limit,
    resetAt,
    cachedAt: Date.now(),
  })
}

async function checkAndIncrementRateLimit(
  identifier: string,
  feature: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const cacheKey = `${identifier}:${feature}`
  const cached = getCachedRateLimit(cacheKey)

  if (cached) {
    // Use cached value, increment in memory
    cached.count++
    cached.cachedAt = Date.now() // Refresh cache timestamp

    const remaining = Math.max(0, cached.limit - cached.count)
    const allowed = cached.count <= cached.limit

    // Update cache with new count
    setCachedRateLimit(cacheKey, cached.count, cached.limit, cached.resetAt)

    return {
      allowed,
      remaining,
      limit: cached.limit,
      resetAt: cached.resetAt,
      reason: allowed ? undefined : `Rate limit exceeded. Resets at ${new Date(cached.resetAt).toISOString()}`,
    }
  }

  const windowStart = new Date(Date.now() - windowSeconds * 1000)

  try {
    // Get or create rate limit entry for this window
    const result = await sql`
      INSERT INTO rate_limits (user_identifier, feature, count, window_start, window_end)
      VALUES (
        ${identifier},
        ${feature},
        1,
        NOW(),
        NOW() + INTERVAL '${windowSeconds} seconds'
      )
      ON CONFLICT (user_identifier, feature, window_start)
      DO UPDATE SET
        count = rate_limits.count + 1,
        updated_at = NOW()
      WHERE rate_limits.window_end > NOW()
      RETURNING count, window_end
    `

    if (result.length === 0) {
      // Window expired, start new window
      await sql`
        DELETE FROM rate_limits 
        WHERE user_identifier = ${identifier} 
        AND feature = ${feature}
        AND window_end < NOW()
      `

      const newResult = await sql`
        INSERT INTO rate_limits (user_identifier, feature, count, window_start, window_end)
        VALUES (
          ${identifier},
          ${feature},
          1,
          NOW(),
          NOW() + INTERVAL '${windowSeconds} seconds'
        )
        RETURNING count, window_end
      `

      const row = newResult[0] as { count: number; window_end: Date }
      const resetAt = new Date(row.window_end).getTime()

      setCachedRateLimit(cacheKey, row.count, maxRequests, resetAt)

      return {
        allowed: true,
        remaining: maxRequests - 1,
        limit: maxRequests,
        resetAt,
      }
    }

    const row = result[0] as { count: number; window_end: Date }
    const resetAt = new Date(row.window_end).getTime()

    setCachedRateLimit(cacheKey, row.count, maxRequests, resetAt)

    if (row.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        limit: maxRequests,
        resetAt,
        reason: `Rate limit exceeded. Resets at ${new Date(resetAt).toISOString()}`,
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - row.count),
      limit: maxRequests,
      resetAt,
    }
  } catch (error: any) {
    logger.error("Rate limit check error", { error, identifier, feature })
    // On error, allow with generous fallback
    return {
      allowed: true,
      remaining: maxRequests,
      limit: maxRequests,
      resetAt: Date.now() + windowSeconds * 1000,
    }
  }
}

async function getRateLimitOnly(
  identifier: string,
  feature: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const cacheKey = `${identifier}:${feature}`
  const cached = getCachedRateLimit(cacheKey)

  if (cached) {
    return {
      allowed: cached.count < cached.limit,
      remaining: Math.max(0, cached.limit - cached.count),
      limit: cached.limit,
      resetAt: cached.resetAt,
    }
  }

  try {
    const result = await sql`
      SELECT count, window_end
      FROM rate_limits
      WHERE user_identifier = ${identifier}
      AND feature = ${feature}
      AND window_end > NOW()
      ORDER BY window_start DESC
      LIMIT 1
    `

    if (result.length === 0) {
      return {
        allowed: true,
        remaining: maxRequests,
        limit: maxRequests,
        resetAt: Date.now() + windowSeconds * 1000,
      }
    }

    const row = result[0] as { count: number; window_end: Date }
    const resetAt = new Date(row.window_end).getTime()

    setCachedRateLimit(cacheKey, row.count, maxRequests, resetAt)

    return {
      allowed: row.count < maxRequests,
      remaining: Math.max(0, maxRequests - row.count),
      limit: maxRequests,
      resetAt,
    }
  } catch (error: any) {
    logger.error("Rate limit status check error", { error, identifier, feature })
    return {
      allowed: true,
      remaining: maxRequests,
      limit: maxRequests,
      resetAt: Date.now() + windowSeconds * 1000,
    }
  }
}

export async function checkGlobalRateLimit(
  userId: string | null,
  ipAddress: string,
  isPro = false,
): Promise<RateLimitResult> {
  const userTier = getUserTier(userId, isPro)
  const configKey = `global_${userTier}`

  const config = await getConfig(configKey)
  if (!config) {
    const limit = isPro ? 10000 : userId ? 1000 : 100
    return { allowed: true, remaining: limit, limit, resetAt: Date.now() + 86400000 }
  }

  const identifier = userId || ipAddress
  if (!identifier) {
    return {
      allowed: false,
      remaining: 0,
      limit: config.max_requests,
      resetAt: Date.now() + config.window_seconds * 1000,
      reason: "No identifier provided",
    }
  }

  return checkAndIncrementRateLimit(identifier, `global_${userTier}`, config.max_requests, config.window_seconds)
}

export async function incrementGlobalRateLimit(userId: string | null, ipAddress: string, isPro = false): Promise<void> {
  // No-op: checkGlobalRateLimit now auto-increments
  // This function kept for backward compatibility
}

export async function checkModelRateLimit(
  userId: string | null,
  ipAddress: string,
  model: string,
  isPro = false,
): Promise<RateLimitResult> {
  if (isPro) {
    return { allowed: true, remaining: 9999, limit: 9999, resetAt: Date.now() + 3600000 }
  }

  const modelKeyMap: Record<string, string> = {
    "openai/gpt-4o": "model_gpt4o",
    "anthropic/claude-3.5-sonnet": "model_claude_sonnet",
    "anthropic/claude-3.5-haiku": "model_claude_haiku",
    "openai/gpt-4o-mini": "model_gpt4o_mini",
    "google/gemini-2.0-flash": "model_gemini_flash",
    "groq/llama-3.1-8b": "model_llama_8b",
    "groq/llama-3.3-70b": "model_llama_70b",
  }

  const configKey = modelKeyMap[model]
  if (!configKey) {
    return { allowed: true, remaining: 9999, limit: 9999, resetAt: Date.now() + 3600000 }
  }

  const config = await getConfig(configKey)
  if (!config) {
    return { allowed: true, remaining: 100, limit: 100, resetAt: Date.now() + 3600000 }
  }

  const identifier = userId || ipAddress
  return checkAndIncrementRateLimit(identifier, `model_${model}`, config.max_requests, config.window_seconds)
}

export async function incrementModelRateLimit(
  userId: string | null,
  ipAddress: string,
  model: string,
  isPro = false,
): Promise<void> {
  // No-op: checkModelRateLimit now auto-increments
  // This function kept for backward compatibility
}

export async function checkFeatureRateLimit(
  feature: string,
  userId: string | null,
  ipAddress: string,
  isPro = false,
): Promise<RateLimitResult> {
  const userTier = getUserTier(userId, isPro)
  const configKey = `feature_${feature}_${userTier}`

  const config = await getConfig(configKey)
  if (!config) {
    const limit = isPro ? 500 : userId ? 50 : 3
    return { allowed: true, remaining: limit, limit, resetAt: Date.now() + 86400000 }
  }

  const identifier = userId || ipAddress
  if (!identifier) {
    return {
      allowed: false,
      remaining: 0,
      limit: config.max_requests,
      resetAt: Date.now() + config.window_seconds * 1000,
      reason: "No identifier provided",
    }
  }

  return checkAndIncrementRateLimit(
    identifier,
    `feature_${feature}_${userTier}`,
    config.max_requests,
    config.window_seconds,
  )
}

export async function incrementFeatureRateLimit(
  feature: string,
  userId: string | null,
  ipAddress: string,
  isPro = false,
): Promise<void> {
  // No-op: checkFeatureRateLimit now auto-increments
  // This function kept for backward compatibility
}

export function clearConfigCache(): void {
  configCache = null
}

export function clearRateLimitCache(): void {
  rateLimitCache.clear()
}

export async function getRateLimitStatus(
  userId: string | null,
  ipAddress: string,
  type: "global" | "feature" = "global",
  feature?: string,
  isPro = false,
): Promise<RateLimitResult & { tier: string }> {
  const userTier = getUserTier(userId, isPro)

  if (type === "global") {
    const configKey = `global_${userTier}`
    const config = await getConfig(configKey)
    if (!config) {
      const limit = isPro ? 10000 : userId ? 1000 : 100
      return { allowed: true, remaining: limit, limit, resetAt: Date.now() + 86400000, tier: userTier }
    }

    const identifier = userId || ipAddress
    const result = await getRateLimitOnly(identifier, `global_${userTier}`, config.max_requests, config.window_seconds)
    return { ...result, tier: userTier }
  } else {
    if (!feature) {
      throw new Error("Feature name required for feature rate limit status")
    }

    const configKey = `feature_${feature}_${userTier}`
    const config = await getConfig(configKey)
    if (!config) {
      const limit = isPro ? 500 : userId ? 50 : 3
      return { allowed: true, remaining: limit, limit, resetAt: Date.now() + 86400000, tier: userTier }
    }

    const identifier = userId || ipAddress
    const result = await getRateLimitOnly(
      identifier,
      `feature_${feature}_${userTier}`,
      config.max_requests,
      config.window_seconds,
    )
    return { ...result, tier: userTier }
  }
}
