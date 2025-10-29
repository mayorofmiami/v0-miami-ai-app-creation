import { checkRateLimit } from "@/lib/redis"
import { NextResponse } from "next/server"

export async function withRateLimit(userId: string, limit = 100, handler: () => Promise<Response>): Promise<Response> {
  const rateLimit = await checkRateLimit(userId, limit)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "You have exceeded the maximum number of requests. Please try again later.",
        remaining: rateLimit.remaining,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600",
        },
      },
    )
  }

  const response = await handler()

  // Add rate limit headers to successful responses
  if (response.headers) {
    response.headers.set("X-RateLimit-Limit", limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString())
  }

  return response
}
