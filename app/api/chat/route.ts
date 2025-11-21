import { streamText, convertToModelMessages } from "ai"
import type { NextRequest } from "next/server"
import { checkFeatureRateLimit } from "@/lib/unified-rate-limit"
import { getClientIp } from "@/lib/redis"
import { logger } from "@/lib/logger"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userId, threadId, model = "openai/gpt-4o-mini" } = body

    const ipAddress = getClientIp(request)
    const rateLimitCheck = await checkFeatureRateLimit(userId, ipAddress, "search")

    if (!rateLimitCheck.allowed) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          remaining: rateLimitCheck.remaining,
          resetAt: rateLimitCheck.resetAt,
        },
        { status: 429 },
      )
    }

    const modelMessages = convertToModelMessages(messages)

    const result = streamText({
      model,
      messages: modelMessages,
      temperature: 0.7,
      maxTokens: 2000,
      abortSignal: request.signal,
      onFinish: async ({ text, usage }) => {
        if (userId && threadId) {
          try {
            const { saveSearchToHistory } = await import("@/lib/db")
            await saveSearchToHistory(userId, threadId, messages[messages.length - 1].content, "chat", text)
          } catch (error) {
            logger.error("Failed to save chat to history", error)
          }
        }

        // Track usage
        if (usage) {
          logger.info("Chat completion", {
            model,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          })
        }
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    logger.error("Chat API error", error)
    return Response.json({ error: error instanceof Error ? error.message : "Chat failed" }, { status: 500 })
  }
}
