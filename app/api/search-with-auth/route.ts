import { streamText } from "ai"
import { searchWeb, formatSearchContext } from "@/lib/web-search"
import { incrementSearchCount, createSearchHistory } from "@/lib/db"
import { getCachedSearchResult, cacheSearchResult, checkRateLimit } from "@/lib/redis"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { query, mode, userId } = await req.json()

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Query is required" }, { status: 400 })
    }

    // Check if user is authenticated (in production, verify JWT or session)
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(userId, 100)
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Rate limit exceeded. Please try again later.", remaining: rateLimit.remaining },
        { status: 429 },
      )
    }

    const cached = await getCachedSearchResult(query, mode)
    if (cached) {
      console.log("[v0] Serving cached result for authenticated user:", query)

      // Still increment search count and save to history
      await incrementSearchCount(userId)
      await createSearchHistory(userId, query, cached.response, cached.citations, mode)

      // Return cached result as a stream
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const citationsData = {
            type: "citations",
            citations: cached.citations,
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(citationsData)}\n\n`))

          const words = cached.response.split(" ")
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? " " : "")
            const textData = {
              type: "text",
              content: chunk,
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(textData)}\n\n`))
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Cache": "HIT",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      })
    }

    // Increment search count
    await incrementSearchCount(userId)

    // Perform web search
    const searchResults = await searchWeb(query, mode === "deep" ? 8 : 5)
    const searchContext = formatSearchContext(searchResults)

    // Prepare system prompt based on mode
    const systemPrompt =
      mode === "deep"
        ? `You are Miami.ai, an advanced AI research assistant. Provide comprehensive, detailed answers with in-depth analysis. Use the provided web search results to give thorough explanations. Always cite your sources using [Source X] notation.`
        : `You are Miami.ai, a fast AI search assistant. Provide concise, accurate answers. Use the provided web search results to answer directly. Always cite your sources using [Source X] notation.`

    const userPrompt = `Based on the following web search results, answer this question: "${query}"

Web Search Results:
${searchContext}

Provide a ${mode === "deep" ? "detailed and comprehensive" : "clear and concise"} answer, citing the sources you use.`

    // Stream the AI response
    const result = streamText({
      model: "openai/gpt-4o",
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: mode === "deep" ? 2000 : 800,
      temperature: mode === "deep" ? 0.7 : 0.5,
    })

    let fullResponse = ""
    const citations = searchResults.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }))

    // Create a custom streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, send the citations
          const citationsData = {
            type: "citations",
            citations,
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(citationsData)}\n\n`))

          // Then stream the text response
          for await (const chunk of result.textStream) {
            fullResponse += chunk
            const textData = {
              type: "text",
              content: chunk,
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(textData)}\n\n`))
          }

          await Promise.all([
            cacheSearchResult(query, mode, fullResponse, citations),
            createSearchHistory(userId, query, fullResponse, citations, mode),
          ])

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Cache": "MISS",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Search API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
