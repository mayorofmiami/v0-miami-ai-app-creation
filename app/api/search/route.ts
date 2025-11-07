import { streamText } from "ai"
import { checkRateLimit, incrementRateLimit, createSearchHistory } from "@/lib/db"
import { getModelById } from "@/lib/model-selection"
import { initializeDatabase } from "@/lib/db-init"
import { getCachedResponse, setCachedResponse } from "@/lib/cache"
import { checkRateLimit as checkModelRateLimit } from "@/lib/rate-limiter"
import { trackModelUsage } from "@/lib/cost-tracker"
import { webSearchTool } from "@/lib/tools"
import { searchRequestSchema, validateRequest } from "@/lib/validation"

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

    const body = await request.json()
    const validation = validateRequest(searchRequestSchema, body)

    if (!validation.success) {
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

    const { query, mode, userId, selectedModel, attachments } = validation.data

    const isTimeSensitive = isTimeSensitiveQuery(query)

    console.log(`[v0] Checking cache - isTimeSensitive: ${isTimeSensitive}, query: ${query}, mode: ${mode}`)
    const cached = !isTimeSensitive ? await getCachedResponse(query, mode) : null
    console.log(`[v0] Cache check result:`, cached ? "FOUND" : "NOT FOUND")

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
        },
      })
    } else if (cached) {
      // Cache exists but answer is empty, skip it
    }

    const ipAddress = getClientIp(request)
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

    let webSearchResults = null
    if (hasTavilyKey && isTimeSensitive && !attachments?.length) {
      try {
        const searchResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            max_results: 5,
          }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          webSearchResults = searchData.results || []
        }
      } catch (error) {
        console.error("Web search failed:", error)
        // Continue without search results
      }
    }

    const systemInstruction =
      mode === "deep"
        ? `You are Miami.ai, an advanced AI assistant with ${hasTavilyKey ? "real-time web search capabilities" : "comprehensive knowledge"}${attachments && attachments.length > 0 ? " and vision capabilities" : ""}.

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
- Use emojis strategically (not excessively)
- Keep paragraphs short (2-4 sentences max)
- End with a brief summary or key takeaway when appropriate

Provide comprehensive, detailed answers with in-depth analysis while maintaining excellent readability.`
        : `You are Miami.ai, a fast and knowledgeable AI assistant${hasTavilyKey ? " with real-time web search capabilities" : ""}${attachments && attachments.length > 0 ? " and vision capabilities" : ""}.

**Your Capabilities:**
${
  hasTavilyKey
    ? `- You have access to current information from web search results
- When web search results are provided, use them as your primary source
- Synthesize information from multiple sources
- Cite your sources when using web search results
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
${hasTavilyKey ? "- Use web search proactively for current information - don't deflect or make excuses" : ""}
- Answer questions confidently and comprehensively

${hasTavilyKey && webSearchResults ? "\n**IMPORTANT:** Web search results have been provided below. Use them as your primary source of information. Do not mention knowledge cutoffs or limitations - answer the question directly using the search results.\n" : ""}

Provide accurate, concise answers that are both informative and visually appealing.`

    try {
      const tools = hasTavilyKey && !webSearchResults ? { webSearch: webSearchTool } : undefined

      let messages
      if (webSearchResults && webSearchResults.length > 0) {
        const searchContext = webSearchResults
          .map(
            (result: any, index: number) => `[${index + 1}] ${result.title}\n${result.content}\nSource: ${result.url}`,
          )
          .join("\n\n")

        const enhancedQuery = `${query}\n\n---\nWeb Search Results:\n${searchContext}`
        messages = [{ role: "user" as const, content: enhancedQuery }]
      } else if (attachments && attachments.length > 0) {
        const imageAttachments = attachments.filter((a: any) => a.type.startsWith("image/"))
        if (imageAttachments.length > 0) {
          // For images, use messages format with content array
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
          // For non-image attachments, use simple prompt
          messages = [{ role: "user" as const, content: query }]
        }
      } else {
        // No attachments, use simple prompt
        messages = [{ role: "user" as const, content: query }]
      }

      const result = streamText({
        model: modelSelection.model,
        system: systemInstruction,
        messages,
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

          const sources = webSearchResults ? webSearchResults.map((r: any) => ({ title: r.title, url: r.url })) : []

          await setCachedResponse(query, mode, {
            answer: text,
            sources,
            model: modelSelection.model,
          })

          if (userId && typeof userId === "string" && userId.length > 0) {
            try {
              await createSearchHistory(
                userId,
                query,
                text,
                sources,
                mode,
                modelSelection.model,
                modelSelection.autoSelected,
                modelSelection.reason,
              )
            } catch (error) {
              console.error("Failed to save search to history:", error)
            }
          }

          await incrementRateLimit(
            userId && typeof userId === "string" && userId.length > 0 ? userId : null,
            getClientIp(request),
          )
        },
      })

      const encoder = new TextEncoder()

      const customStream = new ReadableStream({
        async start(controller) {
          try {
            if (!modelSelection) {
              throw new Error("Model selection is undefined")
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

            const relatedSearchesPromise = (async () => {
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

                return relatedText
                  .split("\n")
                  .map((q) => q.trim())
                  .filter((q) => q.length > 0)
                  .slice(0, 5)
              } catch (error) {
                console.error("Failed to generate related searches:", error)
                return []
              }
            })()

            let chunkCount = 0
            let totalText = ""

            for await (const chunk of result.textStream) {
              chunkCount++
              totalText += chunk

              const textData = JSON.stringify({
                type: "text",
                content: chunk,
              })
              controller.enqueue(encoder.encode(`data: ${textData}\n\n`))
            }

            const relatedSearches = await Promise.race([
              relatedSearchesPromise,
              new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 500)),
            ])

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
            try {
              controller.error(error)
            } catch (e) {
              // Controller already closed, ignore
            }
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
