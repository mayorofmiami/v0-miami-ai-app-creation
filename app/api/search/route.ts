import { streamText } from "ai"
import { checkRateLimit, incrementRateLimit, createSearchHistory, updateSearchResponse } from "@/lib/db"
import { getModelById } from "@/lib/model-selection"
import { initializeDatabase } from "@/lib/db-init"
import { getCachedResponse, setCachedResponse } from "@/lib/cache"
import { checkRateLimit as checkModelRateLimit, MODEL_RATE_LIMITS } from "@/lib/rate-limiter"
import { trackModelUsage } from "@/lib/cost-tracker"
import { searchRequestSchema, validateRequest } from "@/lib/validation"
import { getSession } from "@/lib/auth"

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

function isValidCachedResponse(answer: string): boolean {
  const deflectionPhrases = [
    "I can't provide future information",
    "I cannot provide future information",
    "I can't provide details on events",
    "I cannot provide details on events",
    "you can use my web search capability",
    "Would you like me to search",
    "beyond my current knowledge",
    "beyond my knowledge cutoff",
    "due to my knowledge cutoff",
    "my knowledge cutoff",
    "knowledge is current through",
    "let me know if you'd like more details",
    "let me know if you would like",
  ]

  const lowerAnswer = answer.toLowerCase()
  return !deflectionPhrases.some((phrase) => lowerAnswer.includes(phrase.toLowerCase()))
}

function isTimeSensitiveQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase()

  // Check for specific years (2024, 2025, etc.)
  const yearPattern = /\b(202[4-9]|20[3-9]\d)\b/
  if (yearPattern.test(query)) return true

  // Check for time-sensitive keywords
  const timeSensitiveKeywords = [
    "recent",
    "latest",
    "current",
    "new",
    "today",
    "this year",
    "now",
    "upcoming",
    "future",
    "raised funding",
    "just announced",
    "breaking",
    "update",
    "news",
    "trending",
    "this month",
    "this week",
  ]

  return timeSensitiveKeywords.some((keyword) => lowerQuery.includes(keyword))
}

export async function POST(request: Request) {
  try {
    await initializeDatabase()

    const session = await getSession()
    const sessionUserId = session?.userId || null

    const body = await request.json()

    console.log("[v0] Received request body:", JSON.stringify(body, null, 2))
    console.log("[v0] selectedModel from body:", body.selectedModel)

    const validation = validateRequest(searchRequestSchema, body)

    if (!validation.success) {
      console.error("[v0] Validation failed:", validation.error)
      console.error("[v0] Failed body:", JSON.stringify(body, null, 2))

      return new Response(
        JSON.stringify({
          error: validation.error,
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { query, mode, selectedModel, attachments, conversationHistory, threadId } = validation.data
    const userId = sessionUserId // Use server-side session userId

    console.log(
      `[v0] Starting search - query: "${query}", mode: ${mode}, userId: ${userId || "none"}, threadId: ${threadId || "none"}`,
    )

    let finalThreadId = threadId

    // If authenticated user and no thread ID exists, create a new thread
    if (userId && typeof userId === "string" && userId.length > 0 && !finalThreadId) {
      if (!conversationHistory || conversationHistory.length === 0) {
        try {
          const { createThread, generateThreadTitle } = await import("@/lib/db")
          const smartTitle = await generateThreadTitle(query)
          const newThread = await createThread(userId, smartTitle)
          if (newThread) {
            finalThreadId = newThread.id
            console.log(`[v0] Created new thread: ${finalThreadId} with title: "${smartTitle}"`)
          }
        } catch (error) {
          console.error("Failed to create thread:", error)
        }
      }
    }

    const hasConversationHistory = conversationHistory && conversationHistory.length > 0
    const isTimeSensitive = isTimeSensitiveQuery(query)

    console.log(
      `[v0] Checking cache - isTimeSensitive: ${isTimeSensitive}, query: ${query}, mode: ${mode}, hasHistory: ${hasConversationHistory}`,
    )

    const cached = !isTimeSensitive && !hasConversationHistory ? await getCachedResponse(query, mode) : null
    console.log(
      `[v0] Cache check result:`,
      cached ? "FOUND" : hasConversationHistory ? "SKIPPED (has conversation history)" : "NOT FOUND",
    )

    if (cached && cached.answer && cached.answer.trim().length > 0 && isValidCachedResponse(cached.answer)) {
      console.log(`[v0] Returning cached response, answer length: ${cached.answer.length}`)
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const citationsData = JSON.stringify({
              type: "citations",
              content: cached.sources || [],
            })
            controller.enqueue(encoder.encode(`data: ${citationsData}\n\n`))

            const modelData = JSON.stringify({
              type: "model",
              content: {
                model: cached.model || "openai/gpt-4o",
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
            try {
              controller.error(error)
            } catch (e) {
              // Controller already closed, ignore
            }
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...(finalThreadId ? { "X-Thread-Id": finalThreadId } : {}),
        },
      })
    } else if (cached) {
      console.log(`[v0] Cache exists but invalid, proceeding with fresh search`)
    }

    console.log(`[v0] Proceeding with fresh search, checking rate limits...`)

    const ipAddress = getClientIp(request)
    const rateLimitCheck = await checkRateLimit(
      userId && typeof userId === "string" && userId.length > 0 ? userId : null,
      ipAddress,
    )

    console.log(`[v0] Rate limit check - allowed: ${rateLimitCheck.allowed}, remaining: ${rateLimitCheck.remaining}`)

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
    if (attachments && attachments.length > 0) {
      const hasImages = attachments.some((a: any) => a.type.startsWith("image/"))
      if (hasImages) {
        modelSelection = {
          model: userId ? "openai/gpt-4o" : "openai/gpt-4o-mini",
          reason: userId ? "Premium vision model for image analysis" : "Vision model for image analysis",
          autoSelected: true,
        }
      } else {
        modelSelection = {
          model: "openai/gpt-4o",
          reason: "Document analysis",
          autoSelected: true,
        }
      }
    } else if (selectedModel) {
      const model = getModelById(selectedModel)
      modelSelection = {
        model,
        reason: "Manually selected model",
        autoSelected: false,
      }
    } else {
      modelSelection = {
        model: userId ? "openai/gpt-4o" : "openai/gpt-4o-mini",
        reason: userId
          ? "Optimized for web search - high quality with current information"
          : "Fast and efficient model for quick searches",
        autoSelected: true,
      }
    }

    if (userId) {
      const modelRateLimit = await checkModelRateLimit(userId, modelSelection.model, "free")
      console.log(
        `[v0] Model rate limit check - model: ${modelSelection.model}, allowed: ${modelRateLimit.allowed}, remaining: ${modelRateLimit.remaining}`,
      )
      if (!modelRateLimit.allowed) {
        return Response.json(
          {
            error: `Model rate limit exceeded for ${modelSelection.model}. You can use this model ${MODEL_RATE_LIMITS[modelSelection.model]?.maxRequests || 5} times per hour. Please try a different model or wait for the limit to reset.`,
            remaining: modelRateLimit.remaining,
            resetAt: modelRateLimit.resetAt,
          },
          { status: 429 },
        )
      }
    }

    const hasSerperKey = !!process.env.SERPER_API_KEY

    let webSearchResults = null
    if (hasSerperKey && !attachments?.length) {
      try {
        const { getOrFetchWebSearch } = await import("@/lib/redis")

        webSearchResults = await getOrFetchWebSearch(query, async () => {
          console.log("[v0] Fetching fresh web search results from Serper")
          const searchResponse = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
              "X-API-KEY": process.env.SERPER_API_KEY as string,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              q: query,
              num: 5,
            }),
          })

          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            return (searchData.organic || []).slice(0, 5).map((result: any) => ({
              title: result.title || "Untitled",
              url: result.link,
              content: result.snippet || "",
            }))
          }
          return []
        })

        console.log(`[v0] Using ${webSearchResults.length} web search results (cached or fresh)`)
      } catch (error) {
        console.error("Web search failed:", error)
      }
    }

    const systemInstruction =
      mode === "deep"
        ? `You are Miami.ai, an advanced AI assistant with ${hasSerperKey ? "real-time web search capabilities" : "comprehensive knowledge"}${attachments && attachments.length > 0 ? " and vision capabilities" : ""}.

**Knowledge & Search:**
${
  hasSerperKey
    ? `- You have access to real-time web search for current information
- Use the webSearch tool when you need up-to-date data, current events, or recent statistics
- IMPORTANT: When citing sources, use numbered citations like [Source 1], [Source 2], etc.
- The numbers correspond to the search results provided
- Do NOT use emojis in citations - only use the format [Source N] where N is the number
- Combine web search with your knowledge for comprehensive answers`
    : `- Your knowledge is current through June 2024
- For time-sensitive topics, acknowledge your knowledge cutoff
- Focus on providing timeless, foundational knowledge`
}

${
  attachments && attachments.length > 0
    ? `**Vision & Document Analysis:**
- Analyze images in detail, describing what you see
- Extract text from images when relevant
- Answer questions about the visual content
- Combine image analysis with your knowledge for comprehensive answers`
    : ""
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
- Use emojis strategically (not excessively) - but NEVER in citations
- Keep paragraphs short (2-4 sentences max)
- End with a brief summary or key takeaway when appropriate

**Citation Rules:**
- Use ONLY [Source 1], [Source 2], etc. format for citations
- Do NOT use [🔗 Source] or any emoji-based citations
- Place citations at the end of relevant sentences
- You can cite multiple sources like [Source 1, Source 2]

Provide comprehensive, detailed answers with in-depth analysis while maintaining excellent readability.`
        : `You are Miami.ai, a fast and knowledgeable AI assistant${hasSerperKey ? " with real-time web search capabilities" : ""}${attachments && attachments.length > 0 ? " and vision capabilities" : ""}.

**Your Capabilities:**
${
  hasSerperKey
    ? `- You have access to current information from web search results
- When you need current information, use the webSearch tool
- IMPORTANT: When citing sources, use numbered citations like [Source 1], [Source 2], etc.
- The numbers correspond to the search results provided (1-5)
- Do NOT use emojis in citations - only use the format [Source N]
- IMPORTANT: After using webSearch, you MUST synthesize the results into a comprehensive text response
- Never just return tool results - always generate a proper answer based on what you found
- Synthesize information from multiple sources
- Provide direct, comprehensive answers based on the latest information`
    : `- Your knowledge is current through June 2024
- Provide accurate answers based on your training data
- For questions about recent events, acknowledge your knowledge cutoff`
}

${
  attachments && attachments.length > 0
    ? `**Vision & Document Analysis:**
- Analyze images and describe what you see
- Extract relevant information from visual content
- Answer questions about the images`
    : ""
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
${hasSerperKey ? "- Use web search proactively for current information - don't deflect or make excuses" : ""}
- Answer questions confidently and comprehensively
- ALWAYS generate a complete text response - never finish without providing an answer

**Citation Rules:**
- Use ONLY [Source 1], [Source 2], etc. format for citations
- Do NOT use [🔗 Source] or any emoji-based citations
- Place citations at the end of relevant sentences
- You can cite multiple sources like [Source 1, Source 2]

${hasSerperKey && webSearchResults ? "\n**IMPORTANT:** Web search results have been provided below. Use them as your primary source of information. Cite them using [Source 1], [Source 2], etc. Do not mention knowledge cutoffs or limitations - answer the question directly using the search results.\n" : ""}

Provide accurate, concise answers that are both informative and visually appealing.`

    try {
      console.log(`[v0] Creating AI stream with model: ${modelSelection.model}`)

      let messages
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10)
        messages = [...recentHistory]

        if (webSearchResults && webSearchResults.length > 0) {
          const searchContext = webSearchResults
            .map(
              (result: any, index: number) =>
                `[${index + 1}] ${result.title}\n${result.content}\nSource: ${result.url}`,
            )
            .join("\n\n")
          const enhancedQuery = `${query}\n\n---\nWeb Search Results:\n${searchContext}`
          messages.push({ role: "user" as const, content: enhancedQuery })
        } else if (attachments && attachments.length > 0) {
          const imageAttachments = attachments.filter((a: any) => a.type.startsWith("image/"))
          if (imageAttachments.length > 0) {
            messages.push({
              role: "user" as const,
              content: [
                { type: "text" as const, text: query },
                ...imageAttachments.map((img: any) => ({
                  type: "image" as const,
                  image: img.url,
                })),
              ],
            })
          } else {
            messages.push({ role: "user" as const, content: query })
          }
        } else {
          messages.push({ role: "user" as const, content: query })
        }
      } else {
        if (webSearchResults && webSearchResults.length > 0) {
          const searchContext = webSearchResults
            .map(
              (result: any, index: number) =>
                `[${index + 1}] ${result.title}\n${result.content}\nSource: ${result.url}`,
            )
            .join("\n\n")

          const enhancedQuery = `${query}\n\n---\nWeb Search Results:\n${searchContext}`
          messages = [{ role: "user" as const, content: enhancedQuery }]
        } else if (attachments && attachments.length > 0) {
          const imageAttachments = attachments.filter((a: any) => a.type.startsWith("image/"))
          if (imageAttachments.length > 0) {
            messages = [
              {
                role: "user" as const,
                content: [
                  { type: "text" as const, text: query },
                  ...imageAttachments.map((img: any) => ({
                    type: "image" as const,
                    image: img.url,
                  })),
                ],
              },
            ]
          } else {
            messages = [{ role: "user" as const, content: query }]
          }
        } else {
          messages = [{ role: "user" as const, content: query }]
        }
      }

      let savedSearchId: string | null = null
      if (
        userId &&
        typeof userId === "string" &&
        userId.length > 0 &&
        finalThreadId &&
        !finalThreadId.startsWith("local-thread-")
      ) {
        try {
          const positionInThread = conversationHistory ? Math.floor(conversationHistory.length / 2) + 1 : 1
          const sources = webSearchResults ? webSearchResults.map((r: any) => ({ title: r.title, url: r.url })) : []

          // Create initial search record with placeholder response
          const savedSearch = await createSearchHistory(
            userId,
            query,
            "", // Empty response initially
            sources,
            mode,
            modelSelection.model,
            modelSelection.autoSelected,
            modelSelection.reason,
            finalThreadId,
            positionInThread,
          )

          savedSearchId = savedSearch.id
          console.log(
            `[v0] Created search record with id: ${savedSearchId}, threadId: ${finalThreadId}, position: ${positionInThread}`,
          )
        } catch (error) {
          console.error("Failed to create initial search record:", error)
        }
      } else if (finalThreadId?.startsWith("local-thread-")) {
        console.log(`[v0] Skipping search history save - local thread ID: ${finalThreadId}`)
      }

      const result = streamText({
        model: modelSelection.model,
        system: systemInstruction,
        messages,
        maxTokens: mode === "deep" ? 2000 : 800,
        temperature: mode === "deep" ? 0.7 : 0.5,
        onFinish: async ({ text, usage }) => {
          if (usage) {
            await trackModelUsage(
              userId || null,
              modelSelection.model,
              usage.promptTokens || 0,
              usage.completionTokens || 0,
            )
          }

          const sources = webSearchResults ? webSearchResults.map((r: any) => ({ title: r.title, url: r.url })) : []

          await setCachedResponse(query, mode, {
            answer: text,
            sources,
            model: modelSelection.model,
          })

          if (savedSearchId) {
            try {
              await updateSearchResponse(savedSearchId, text)
              console.log(`[v0] Updated search ${savedSearchId} with final response`)
            } catch (error) {
              console.error("Failed to update search response:", error)
            }
          }

          await incrementRateLimit(
            userId && typeof userId === "string" && userId.length > 0 ? userId : null,
            getClientIp(request),
          )
        },
      })

      console.log("[v0] StreamText result obtained, creating custom stream")

      const encoder = new TextEncoder()

      const customStream = new ReadableStream({
        async start(controller) {
          try {
            console.log("[v0] Starting custom stream controller")

            if (!modelSelection) {
              throw new Error("Model selection is undefined")
            }

            if (webSearchResults && webSearchResults.length > 0) {
              const citationsData = JSON.stringify({
                type: "citations",
                content: webSearchResults.map((r: any) => ({
                  title: r.title,
                  url: r.url,
                  snippet: r.content,
                })),
              })
              controller.enqueue(encoder.encode(`data: ${citationsData}\n\n`))
              console.log(`[v0] Sent ${webSearchResults.length} citations to client`)
            }

            const modelData = JSON.stringify({
              type: "model",
              content: {
                model: modelSelection.model,
                reason: modelSelection.reason,
                autoSelected: modelSelection.autoSelected,
              },
            })
            controller.enqueue(encoder.encode(`data: ${modelData}\n\n`))
            console.log("[v0] Sent model data to client")

            let chunkCount = 0
            let totalText = ""

            console.log("[v0] Starting to read text stream...")
            console.log(`[v0] Tools enabled: ${!!undefined}, mode: ${mode}`)

            try {
              console.log("[v0] Reading from textStream (handles tools automatically)")
              for await (const textChunk of result.textStream) {
                chunkCount++
                totalText += textChunk

                if (chunkCount % 10 === 0) {
                  console.log(`[v0] Processed ${chunkCount} chunks, total length: ${totalText.length}`)
                }

                const textData = JSON.stringify({
                  type: "text",
                  content: textChunk,
                })
                controller.enqueue(encoder.encode(`data: ${textData}\n\n`))
              }

              console.log(
                `[v0] Finished streaming. Total chunks: ${chunkCount}, total text length: ${totalText.length}`,
              )
            } catch (streamError) {
              const errorMessage = streamError instanceof Error ? streamError.message : String(streamError)
              const isNetworkError = errorMessage.includes("network error") || errorMessage.includes("aborted")

              // If we got chunks and it's a network error, it's likely just the stream closing normally
              if (chunkCount > 0 && isNetworkError) {
                console.log(`[v0] Stream completed after ${chunkCount} chunks (${totalText.length} characters)`)
              } else {
                // This is a real error
                console.error("[v0] ERROR reading text stream:", streamError)
                console.error("[v0] Stream error details:", {
                  name: streamError instanceof Error ? streamError.name : "unknown",
                  message: errorMessage,
                })

                // If no chunks received, this is a real problem
                if (chunkCount === 0) {
                  throw streamError
                }
              }
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            console.log("[v0] Stream complete, sent [DONE]")
            controller.close()
          } catch (error) {
            console.error("[v0] Error in stream controller:", error)
            try {
              controller.error(error)
            } catch (e) {
              console.error("[v0] Failed to send error to controller:", e)
            }
          }
        },
      })

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-RateLimit-Remaining": rateLimitCheck.remaining.toString(),
          "X-RateLimit-Limit": rateLimitCheck.limit.toString(),
          ...(finalThreadId ? { "X-Thread-Id": finalThreadId } : {}),
          ...(savedSearchId ? { "X-Search-Id": savedSearchId } : {}),
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
