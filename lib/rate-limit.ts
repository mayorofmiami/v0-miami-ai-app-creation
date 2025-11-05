import { createClient } from "@vercel/kv"

// Create KV client with Upstash environment variables
const kv = createClient({
  url: process.env["UPSTASH-KV_KV_REST_API_URL"]!,
  token: process.env["UPSTASH-KV_KV_REST_API_TOKEN"]!,
})

const ATTACHMENT_RATE_LIMIT_FREE = 5 // 5 attachments per day for free users
const ATTACHMENT_RATE_LIMIT_AUTH = 50 // 50 attachments per day for auth users
const RATE_LIMIT_WINDOW = 24 * 60 * 60 // 24 hours in seconds

export async function checkAttachmentRateLimit(
  userId: string | null,
  ipAddress: string | null,
): Promise<{ allowed: boolean; remaining: number; limit: number; resetAt: Date }> {
  const key = userId ? `attachment_rate_limit:user:${userId}` : `attachment_rate_limit:ip:${ipAddress}`
  const limit = userId ? ATTACHMENT_RATE_LIMIT_AUTH : ATTACHMENT_RATE_LIMIT_FREE

  try {
    const current = (await kv.get<number>(key)) || 0
    const ttl = await kv.ttl(key)
    const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : RATE_LIMIT_WINDOW * 1000))

    if (current >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetAt,
      }
    }

    return {
      allowed: true,
      remaining: limit - current,
      limit,
      resetAt,
    }
  } catch (error) {
    console.error("Error checking attachment rate limit:", error)
    // Allow on error to prevent blocking users
    return {
      allowed: true,
      remaining: limit,
      limit,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW * 1000),
    }
  }
}

export async function incrementAttachmentRateLimit(userId: string | null, ipAddress: string | null): Promise<void> {
  const key = userId ? `attachment_rate_limit:user:${userId}` : `attachment_rate_limit:ip:${ipAddress}`

  try {
    const current = (await kv.get<number>(key)) || 0
    await kv.set(key, current + 1, { ex: RATE_LIMIT_WINDOW })
  } catch (error) {
    console.error("Error incrementing attachment rate limit:", error)
  }
}
