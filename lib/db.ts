import "server-only"
import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export interface SearchHistory {
  id: string
  user_id: string
  query: string
  response: string
  citations: Array<{ title: string; url: string; snippet: string }> | null
  mode: "quick" | "deep"
  model_used?: string
  auto_selected?: boolean
  selection_reason?: string
  thread_id?: string // Add optional threadId parameter
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  polar_customer_id: string | null
  polar_subscription_id: string | null
  plan: "free" | "pro"
  status: "active" | "canceled" | "past_due"
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface UsageTracking {
  id: string
  user_id: string
  searches_count: number
  last_reset_at: string
  created_at: string
  updated_at: string
}

export interface ModelPreference {
  id: string
  user_id: string
  model_preference: "auto" | "manual"
  selected_model: string | null
  created_at: string
  updated_at: string
}

export interface RateLimit {
  id: string
  user_id: string | null
  ip_address: string | null
  query_count: number
  window_start: string
  last_query_at: string
  created_at: string
  updated_at: string
}

export interface Thread {
  id: string
  user_id: string
  title: string | null
  mode: "quick" | "deep"
  created_at: string
  updated_at: string
}

// Search History Functions
export async function createSearchHistory(
  userId: string,
  query: string,
  response: string,
  citations: Array<{ title: string; url: string; snippet: string }>,
  mode: "quick" | "deep",
  modelUsed?: string,
  autoSelected?: boolean,
  selectionReason?: string,
  threadId?: string, // Add optional threadId parameter
) {
  const result = await sql`
    INSERT INTO search_history (user_id, query, response, citations, mode, model_used, auto_selected, selection_reason, thread_id)
    VALUES (${userId}, ${query}, ${response}, ${JSON.stringify(citations)}, ${mode}, ${modelUsed || null}, ${autoSelected ?? true}, ${selectionReason || null}, ${threadId || null})
    RETURNING *
  `
  return result[0] as SearchHistory
}

export async function getSearchHistory(userId: string, limit = 10) {
  const result = await sql`
    SELECT * FROM search_history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return result as SearchHistory[]
}

// Subscription Functions
export async function getOrCreateSubscription(userId: string) {
  const existing = await sql`
    SELECT * FROM subscriptions WHERE user_id = ${userId}
  `

  if (existing.length > 0) {
    return existing[0] as Subscription
  }

  const result = await sql`
    INSERT INTO subscriptions (user_id, plan, status)
    VALUES (${userId}, 'free', 'active')
    RETURNING *
  `
  return result[0] as Subscription
}

export async function getUserSubscription(userId: string) {
  const result = await sql`
    SELECT * FROM subscriptions WHERE user_id = ${userId}
  `
  return result[0] as Subscription | undefined
}

export async function updateSubscription(
  userId: string,
  data: {
    polar_customer_id?: string
    polar_subscription_id?: string
    plan?: "free" | "pro"
    status?: "active" | "canceled" | "past_due"
    current_period_end?: string
  },
) {
  const result = await sql`
    UPDATE subscriptions
    SET 
      polar_customer_id = COALESCE(${data.polar_customer_id || null}, polar_customer_id),
      polar_subscription_id = COALESCE(${data.polar_subscription_id || null}, polar_subscription_id),
      plan = COALESCE(${data.plan || null}, plan),
      status = COALESCE(${data.status || null}, status),
      current_period_end = COALESCE(${data.current_period_end || null}, current_period_end),
      updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING *
  `
  return result[0] as Subscription
}

// Usage Tracking Functions
export async function getOrCreateUsageTracking(userId: string) {
  const existing = await sql`
    SELECT * FROM usage_tracking WHERE user_id = ${userId}
  `

  if (existing.length > 0) {
    const usage = existing[0] as UsageTracking
    // Reset if it's been more than 24 hours
    const lastReset = new Date(usage.last_reset_at)
    const now = new Date()
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)

    if (hoursSinceReset >= 24) {
      const reset = await sql`
        UPDATE usage_tracking
        SET searches_count = 0, last_reset_at = NOW(), updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `
      return reset[0] as UsageTracking
    }

    return usage
  }

  const result = await sql`
    INSERT INTO usage_tracking (user_id, searches_count)
    VALUES (${userId}, 0)
    RETURNING *
  `
  return result[0] as UsageTracking
}

export async function incrementSearchCount(userId: string) {
  const result = await sql`
    UPDATE usage_tracking
    SET searches_count = searches_count + 1, updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING *
  `
  return result[0] as UsageTracking
}

export async function canUserSearch(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  // For now, everyone has unlimited searches
  // Subscription tiers will be added later
  return { allowed: true }
}

// Model Preference Functions
export async function getModelPreference(userId: string) {
  try {
    const result = await sql`
      SELECT * FROM model_preferences WHERE user_id = ${userId}
    `
    return result[0] as ModelPreference | undefined
  } catch (error: any) {
    if (!error?.message?.includes('relation "model_preferences" does not exist')) {
      console.error("[v0] Get model preference error:", error?.message || error)
    }
    return undefined
  }
}

export async function getOrCreateModelPreference(userId: string) {
  try {
    const existing = await getModelPreference(userId)

    if (existing) {
      return existing
    }

    const result = await sql`
      INSERT INTO model_preferences (user_id, model_preference, selected_model)
      VALUES (${userId}, 'auto', NULL)
      RETURNING *
    `
    return result[0] as ModelPreference
  } catch (error: any) {
    if (!error?.message?.includes('relation "model_preferences" does not exist')) {
      console.error("[v0] Get or create model preference error:", error?.message || error)
    }
    // Return default preference
    return {
      id: "temp",
      user_id: userId,
      model_preference: "auto" as const,
      selected_model: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function updateModelPreference(
  userId: string,
  modelPreference: "auto" | "manual",
  selectedModel?: string | null,
) {
  try {
    const result = await sql`
      INSERT INTO model_preferences (user_id, model_preference, selected_model, updated_at)
      VALUES (${userId}, ${modelPreference}, ${selectedModel || null}, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        model_preference = ${modelPreference},
        selected_model = ${selectedModel || null},
        updated_at = NOW()
      RETURNING *
    `
    return result[0] as ModelPreference
  } catch (error: any) {
    if (!error?.message?.includes('relation "model_preferences" does not exist')) {
      console.error("[v0] Update model preference error:", error?.message || error)
    }
    // Return the preference that was attempted to be saved
    return {
      id: "temp",
      user_id: userId,
      model_preference: modelPreference,
      selected_model: selectedModel || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

// Rate Limiting Functions
export async function checkRateLimit(
  userId: string | null,
  ipAddress: string | null,
): Promise<{ allowed: boolean; remaining: number; limit: number; reason?: string }> {
  try {
    const limit = userId ? 100 : 1000 // Signed: 100, Unsigned: 1000

    // Get or create rate limit record
    const identifier = userId || ipAddress
    const identifierType = userId ? "user_id" : "ip_address"

    if (!identifier) {
      return { allowed: false, remaining: 0, limit, reason: "No identifier provided" }
    }

    // Check existing rate limit
    const existing = userId
      ? await sql`SELECT * FROM rate_limits WHERE user_id = ${userId} ORDER BY window_start DESC LIMIT 1`
      : await sql`SELECT * FROM rate_limits WHERE ip_address = ${ipAddress} AND user_id IS NULL ORDER BY window_start DESC LIMIT 1`

    if (existing.length === 0) {
      // Create new rate limit record
      const newRecord = userId
        ? await sql`
            INSERT INTO rate_limits (user_id, query_count, window_start, last_query_at)
            VALUES (${userId}, 0, NOW(), NOW())
            RETURNING *
          `
        : await sql`
            INSERT INTO rate_limits (ip_address, query_count, window_start, last_query_at)
            VALUES (${ipAddress}, 0, NOW(), NOW())
            RETURNING *
          `

      return { allowed: true, remaining: limit, limit }
    }

    const record = existing[0] as RateLimit
    const windowStart = new Date(record.window_start)
    const now = new Date()
    const hoursSinceStart = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60)

    // Reset if window has passed (24 hours)
    if (hoursSinceStart >= 24) {
      const reset = userId
        ? await sql`
            UPDATE rate_limits
            SET query_count = 0, window_start = NOW(), last_query_at = NOW(), updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING *
          `
        : await sql`
            UPDATE rate_limits
            SET query_count = 0, window_start = NOW(), last_query_at = NOW(), updated_at = NOW()
            WHERE ip_address = ${ipAddress} AND user_id IS NULL
            RETURNING *
          `

      return { allowed: true, remaining: limit, limit }
    }

    // Check if limit exceeded
    if (record.query_count >= limit) {
      const hoursRemaining = Math.ceil(24 - hoursSinceStart)
      return {
        allowed: false,
        remaining: 0,
        limit,
        reason: `Rate limit exceeded. Resets in ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""}.`,
      }
    }

    return {
      allowed: true,
      remaining: limit - record.query_count,
      limit,
    }
  } catch (error: any) {
    if (error?.message?.includes('relation "rate_limits" does not exist')) {
      // Silently allow - rate limiting tables not set up yet
      const limit = userId ? 100 : 1000
      return { allowed: true, remaining: limit, limit }
    }
    // Log other errors
    console.error("[v0] Rate limit check error:", error?.message || error)
    const limit = userId ? 100 : 1000
    return { allowed: true, remaining: limit, limit }
  }
}

export async function incrementRateLimit(userId: string | null, ipAddress: string | null): Promise<void> {
  try {
    if (userId) {
      await sql`
        UPDATE rate_limits
        SET query_count = query_count + 1, last_query_at = NOW(), updated_at = NOW()
        WHERE user_id = ${userId}
      `
    } else if (ipAddress) {
      await sql`
        UPDATE rate_limits
        SET query_count = query_count + 1, last_query_at = NOW(), updated_at = NOW()
        WHERE ip_address = ${ipAddress} AND user_id IS NULL
      `
    }
  } catch (error: any) {
    if (!error?.message?.includes('relation "rate_limits" does not exist')) {
      console.error("[v0] Rate limit increment error:", error?.message || error)
    }
  }
}
