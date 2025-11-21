import { streamText } from "ai"
import type { NextRequest } from "next/server"
import { selectModel } from "@/lib/model-selection"
import { analyzeQuery } from "@/lib/model-selection"
import { getCachedResponse, setCachedResponse, trackModelUsage, getClientIp, getOrFetchWebSearch } from "@/lib/redis"
import { checkFeatureRateLimit } from "@/lib/unified-rate-limit"
import { updateSearchResponse } from "@/lib/db"
import { logger } from "@/lib/logger"

export const maxDuration = 60

function isValidCachedResponse(answer: string): boolean {
  if (!answer || answer.trim().length < 50) return false
  if (answer.includes("error") && answer.length < 200) return false
  if (answer.includes("failed") && answer.length < 200) return false
  return true
}

async function getUserInfo(request: NextRequest) {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      mode = "concise",
      conversationHistory = [],
      userId,
      threadId,
      selectedModel,
      attachments = [],
    } = body

    const safeAttachments = Array.isArray(attachments) ? attachments : []

    const hasConversationHistory = conversationHistory && conversationHistory.length > 0

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
            logger.info("Created new thread", { threadId: finalThreadId, title: smartTitle })
          }
        } catch (error) {
          logger.error("Failed to create thread", error)
        }
      }
    }

    const { isTimeSensitive } = analyzeQuery(query)

    const cached = !isTimeSensitive && !hasConversationHistory ? await getCachedResponse(query, mode) : null

    if (cached && cached.answer && cached.answer.trim().length > 0 && isValidCachedResponse(cached.answer)) {
      logger.debug("Returning cached response", { queryLength: query.length, answerLength: cached.answer.length })

      let savedSearchId = null
      if (userId && finalThreadId) {
        try {
          const { saveSearchToHistory } = await import("@/lib/db")
          savedSearchId = await saveSearchToHistory(userId, finalThreadId, query, mode, cached.answer)
        } catch (error) {
          logger.error("Failed to save cached search to history", error)
        }
      }

      return Response.json({
        cached: true,
        answer: cached.answer,
        sources: cached.sources || [],
        model: cached.model || "unknown",
        searchId: savedSearchId,
      })
    }

    const ipAddress = getClientIp(request)

    const rateLimitCheck = await checkFeatureRateLimit(userId, ipAddress, "search")

    if (!rateLimitCheck.allowed) {
      return Response.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          remaining: rateLimitCheck.remaining,
          resetAt: rateLimitCheck.resetAt,
        },
        { status: 429 },
      )
    }

    const modelSelection = await selectModel(query, mode, userId, selectedModel)

    if (!modelSelection || !modelSelection.model) {
      return Response.json({ error: "Failed to select model" }, { status: 500 })
    }

    let savedSearchId = null
    if (userId && finalThreadId) {
      try {
        const { saveSearchToHistory } = await import("@/lib/db")
        savedSearchId = await saveSearchToHistory(userId, finalThreadId, query, mode, "")
      } catch (error) {
        logger.error("Failed to save search to history", error)
      }
    }

    const modelRateLimit = await checkFeatureRateLimit(
      userId && typeof userId === "string" && userId.length > 0 ? userId : ipAddress,
      modelSelection.model,
    )

    if (!modelRateLimit.allowed) {
      return Response.json(
        {
          error: `Model rate limit exceeded for ${modelSelection.model}. Please try again later.`,
          remaining: modelRateLimit.remaining,
          resetAt: modelRateLimit.resetAt,
        },
        { status: 429 },
      )
    }

    const hasSerperKey = !!process.env.SERPER_API_KEY

    let webSearchResults = null
    if (hasSerperKey && !safeAttachments.length) {
      try {
        webSearchResults = await getOrFetchWebSearch(query, async () => {
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
      } catch (error) {
        logger.error("Web search error", error)
        webSearchResults = null
      }
    }

    const systemMessage =
      mode === "deep"
        ? `You are Miami.ai, an advanced AI assistant with ${hasSerperKey ? "real-time web search capabilities" : "comprehensive knowledge"}${safeAttachments && safeAttachments.length > 0 ? " and vision capabilities" : ""}.

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
  safeAttachments && safeAttachments.length > 0
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
        : `You are Miami.ai, a fast and knowledgeable AI assistant${hasSerperKey ? " with real-time web search capabilities" : ""}${safeAttachments && safeAttachments.length > 0 ? " and vision capabilities" : ""}.

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
  safeAttachments && safeAttachments.length > 0
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

    let messages
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10)
      messages = [...recentHistory]

      if (webSearchResults && webSearchResults.length > 0) {
        const searchContext = webSearchResults
          .map(
            (result: any, index: number) => `[${index + 1}] ${result.title}\n${result.content}\nSource: ${result.url}`,
          )
          .join("\n\n")
        const enhancedQuery = `${query}\n\n---\nWeb Search Results:\n${searchContext}`
        messages.push({ role: "user" as const, content: enhancedQuery })
      } else if (safeAttachments && safeAttachments.length > 0) {
        const imageAttachments = safeAttachments.filter((a: any) => a.type.startsWith("image/"))
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
            (result: any, index: number) => `[${index + 1}] ${result.title}\n${result.content}\nSource: ${result.url}`,
          )
          .join("\n\n")

        const enhancedQuery = `${query}\n\n---\nWeb Search Results:\n${searchContext}`
        messages = [{ role: "user" as const, content: enhancedQuery }]
      } else if (safeAttachments && safeAttachments.length > 0) {
        const imageAttachments = safeAttachments.filter((a: any) => a.type.startsWith("image/"))
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

    const maxTokens = mode === "deep" ? 2000 : 800
    const formattedMessages = messages

    const result = streamText({
      model: modelSelection.model,
      system: systemMessage,
      messages: formattedMessages,
      maxTokens: maxTokens,
      temperature: 0.7,
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
          } catch (error) {
            logger.error("Failed to update search response", error)
          }
        }
      },
    })

    const encoder = new TextEncoder()

    const customStream = new ReadableStream({
      async start(controller) {
        try {
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

          let chunkCount = 0
          let totalText = ""

          try {
            for await (const textChunk of result.textStream) {
              chunkCount++
              totalText += textChunk

              const messageData = JSON.stringify({
                type: "text",
                content: textChunk,
              })
              controller.enqueue(encoder.encode(`data: ${messageData}\n\n`))
            }

            if (chunkCount === 0) {
              logger.error("No chunks received from AI model")
              const errorData = JSON.stringify({
                type: "error",
                content: "Failed to get response from AI model. Please try again.",
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            }
          } catch (streamError) {
            const errorMessage = streamError instanceof Error ? streamError.message : String(streamError)
            const isNetworkError = errorMessage.includes("network error") || errorMessage.includes("aborted")

            logger.error("Stream error", streamError, { chunkCount, totalTextLength: totalText.length })

            if (chunkCount === 0 && !isNetworkError) {
              const errorData = JSON.stringify({
                type: "error",
                content: "Unable to connect to AI model. Please try again or contact support if this persists.",
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          logger.error("Stream controller error", error)
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
  } catch (error) {
    logger.error("Search streaming error", error)
    return Response.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 500 })
  }
}
