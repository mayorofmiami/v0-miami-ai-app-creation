import { redis } from "./redis"

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
    const current = (await redis.get<number>(key)) || 0
    const ttl = await redis.ttl(key)
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
    const current = (await redis.get<number>(key)) || 0
    await redis.setex(key, RATE_LIMIT_WINDOW, current + 1)
  } catch (error) {
    console.error("Error incrementing attachment rate limit:", error)
  }
}
