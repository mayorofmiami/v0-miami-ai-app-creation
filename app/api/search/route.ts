import { streamText } from "ai"
import { checkRateLimit, incrementRateLimit, createSearchHistory } from "@/lib/db"
import { getModelById } from "@/lib/model-selection"
import { initializeDatabase } from "@/lib/db-init"
import { getCachedResponse, setCachedResponse } from "@/lib/cache"
import { checkRateLimit as checkModelRateLimit } from "@/lib/rate-limiter"
import { trackModelUsage } from "@/lib/cost-tracker"
import { webSearchTool } from "@/lib/tools"

export const maxDuration = 30

function getClientIp(request: Request): string | null {
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

export async function POST(req: Request) {
  try {
    await initializeDatabase()

    const { query, mode, userId, selectedModel } = await req.json()

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Query is required" }, { status: 400 })
    }

    const cached = await getCachedResponse(query, mode)
    if (cached) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const citationsData = JSON.stringify({
              type: "citations",
              content: cached.sources,
            })
            controller.enqueue(encoder.encode(`data: ${citationsData}\n\n`))

            const modelData = JSON.stringify({
              type: "model",
              content: {
                model: cached.model,
                reason: "Cached response",
                autoSelected: false,
              },
            })
            controller.enqueue(encoder.encode(`data: ${modelData}\n\n`))

            const chunkSize = 150
            for (let i = 0; i < cached.answer.length; i += chunkSize) {
              const chunk = cached.answer.slice(i, i + chunkSize)
              const textData = JSON.stringify({
                type: "text",
                content: chunk,
              })
              controller.enqueue(encoder.encode(`data: ${textData}\n\n`))
              await new Promise((resolve) => setTimeout(resolve, 17))
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          } catch (error) {
            console.error("Error in cached stream:", error)
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    const ipAddress = getClientIp(req)
    const rateLimitCheck = await checkRateLimit(
      userId && typeof userId === "string" && userId.length > 0 ? userId : null,
      ipAddress,
    )

    if (!rateLimitCheck.allowed) {
      return Response.json(
        {
          error: rateLimitCheck.reason || "Rate limit exceeded",
          remaining: rateLimitCheck.remaining,
          limit: rateLimitCheck.limit,
        },
        { status: 429 },
      )
    }

    let modelSelection
    if (selectedModel) {
      const model = getModelById(selectedModel)
      modelSelection = {
        model,
        reason: "Manually selected model",
        autoSelected: false,
      }
    } else {
      modelSelection = {
        model: "openai/gpt-4o",
        reason: "Optimized for web search - high quality with current information",
        autoSelected: true,
      }
    }

    if (userId) {
      const modelRateLimit = await checkModelRateLimit(userId, modelSelection.model, "free")
      if (!modelRateLimit.allowed) {
        return Response.json(
          {
            error: `Rate limit exceeded for ${modelSelection.model}. Please try a different model or upgrade to Pro.`,
            remaining: modelRateLimit.remaining,
            resetAt: modelRateLimit.resetAt,
          },
          { status: 429 },
        )
      }
    }

    const hasTavilyKey = !!process.env.TAVILY_API_KEY

    const systemInstruction =
      mode === "deep"
        ? `You are Miami.ai, an advanced AI assistant with ${hasTavilyKey ? "real-time web search capabilities" : "comprehensive knowledge"}.

**Knowledge & Search:**
${
  hasTavilyKey
    ? `- You have access to real-time web search for current information
- Use the webSearch tool when you need up-to-date data, current events, or recent statistics
- Always cite your sources when using web search results
- Combine web search with your knowledge for comprehensive answers`
    : `- Your knowledge is current through June 2024
- For time-sensitive topics, acknowledge your knowledge cutoff
- Focus on providing timeless, foundational knowledge`
}

**Response Formatting:**
Use rich markdown formatting to create visually appealing, easy-to-scan responses:

📋 **Structure:**
- Start with a brief overview (2-3 sentences)
- Use ## for main sections and ### for subsections
- Break complex topics into digestible parts

✨ **Visual Elements:**
- Add relevant emojis to section headings (📊 Data, 🔍 Analysis, 💡 Key Points, ⚡ Quick Facts, 🎯 Recommendations)
- Use **bold** for emphasis and key terms
- Use bullet points (•) for lists
- Use numbered lists for steps or rankings
- Use > blockquotes for important highlights or quotes
- Use tables for comparisons when helpful
- Use \`code\` formatting for technical terms

🎨 **Engagement:**
- Make responses scannable with clear visual hierarchy
- Use emojis strategically (not excessively)
- Keep paragraphs short (2-4 sentences max)
- End with a brief summary or key takeaway when appropriate

Provide comprehensive, detailed answers with in-depth analysis while maintaining excellent readability.`
        : `You are Miami.ai, a fast AI assistant ${hasTavilyKey ? "with real-time web search" : "providing accurate answers"}.

**Knowledge & Search:**
${
  hasTavilyKey
    ? `- You have access to real-time web search for current information
- Use webSearch tool for current events, recent data, or time-sensitive queries
- Cite sources when using web search`
    : `- Your knowledge is current through June 2024
- For time-sensitive queries, acknowledge your knowledge cutoff`
}

**Response Formatting:**
Create clean, scannable responses using markdown:

✨ **Format Guidelines:**
- Use relevant emojis for visual appeal (📍 Locations, ✅ Confirmations, 💡 Tips, ⚡ Key Points, 🎯 Recommendations)
- Use **bold** for important information
- Use bullet points for lists
- Keep it concise but well-structured
- Use short paragraphs (1-3 sentences)

🎯 **Style:**
- Direct and to-the-point
- Easy to scan quickly
- Visually organized with emojis and formatting
- Professional but friendly tone

Provide accurate, concise answers that are both informative and visually appealing.`

    try {
      const tools = hasTavilyKey ? { webSearch: webSearchTool } : undefined

      const result = streamText({
        model: modelSelection.model,
        system: systemInstruction,
        prompt: query,
        maxTokens: mode === "deep" ? 2000 : 800,
        temperature: mode === "deep" ? 0.7 : 0.5,
        ...(tools && { tools, maxSteps: 5 }),
        onFinish: async ({ text, usage }) => {
          if (usage) {
            await trackModelUsage(
              userId || null,
              modelSelection.model,
              usage.promptTokens || 0,
              usage.completionTokens || 0,
            )
          }

          await setCachedResponse(query, mode, {
            answer: text,
            sources: [], // No external sources for free tier
            model: modelSelection.model,
          })

          if (userId && typeof userId === "string" && userId.length > 0) {
            try {
              await createSearchHistory(
                userId,
                query,
                text,
                [], // No external sources
                mode,
                modelSelection.model,
                modelSelection.autoSelected,
                modelSelection.reason,
              )
            } catch (error) {
              console.error("Failed to save search to history:", error)
            }
          }

          await incrementRateLimit(userId && typeof userId === "string" && userId.length > 0 ? userId : null, ipAddress)
        },
      })

      const encoder = new TextEncoder()

      const customStream = new ReadableStream({
        async start(controller) {
          try {
            const modelData = JSON.stringify({
              type: "model",
              content: {
                model: modelSelection.model,
                reason: modelSelection.reason,
                autoSelected: modelSelection.autoSelected,
              },
            })
            controller.enqueue(encoder.encode(`data: ${modelData}\n\n`))

            for await (const chunk of result.textStream) {
              const textData = JSON.stringify({
                type: "text",
                content: chunk,
              })
              controller.enqueue(encoder.encode(`data: ${textData}\n\n`))
            }

            let relatedSearches: string[] = []
            try {
              const { streamText: relatedStream } = await import("ai")
              const relatedResult = relatedStream({
                model: "openai/gpt-4o-mini",
                prompt: `Based on this search query, generate exactly 5 contextually relevant follow-up questions.

Original Query: "${query}"

Generate 5 follow-up questions that:
- Are directly relevant to the topic being searched
- Naturally extend the conversation about this specific subject
- Cover different angles (deeper dive, related topics, practical applications, comparisons, current trends)
- Are concise and actionable
- Feel natural and conversational
${query.toLowerCase().includes("miami") ? "- Include Miami-specific context where relevant" : ""}

Return ONLY the 5 questions, one per line, without numbering or bullet points.`,
                maxTokens: 200,
                temperature: 0.7,
              })

              let relatedText = ""
              for await (const chunk of relatedResult.textStream) {
                relatedText += chunk
              }

              relatedSearches = relatedText
                .split("\n")
                .map((q) => q.trim())
                .filter((q) => q.length > 0)
                .slice(0, 5)
            } catch (error) {
              console.error("Failed to generate related searches:", error)
            }

            if (relatedSearches.length > 0) {
              const relatedData = JSON.stringify({
                type: "related_searches",
                content: relatedSearches,
              })
              controller.enqueue(encoder.encode(`data: ${relatedData}\n\n`))
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          } catch (error) {
            console.error("Error in stream:", error)
            controller.error(error)
          }
        },
      })

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } catch (error: any) {
      console.error("Error creating AI response:", error)

      if (error.message && error.message.includes("rate_limit_exceeded")) {
        return Response.json(
          {
            error:
              "AI Gateway rate limit exceeded. Please try again in a few moments or upgrade to Pro for higher limits.",
            type: "ai_gateway_rate_limit",
          },
          { status: 429 },
        )
      }

      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  } catch (error) {
    console.error("Search API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
