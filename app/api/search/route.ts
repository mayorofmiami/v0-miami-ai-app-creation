import { generateText } from "ai"
import { searchWeb, formatSearchContext } from "@/lib/web-search"
import { checkRateLimit, incrementRateLimit, createSearchHistory } from "@/lib/db" // added createSearchHistory import
import { selectModel, getModelById } from "@/lib/model-selection"
import { initializeDatabase } from "@/lib/db-init"

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

    if (!process.env.EXA_API_KEY) {
      console.error("[v0] EXA_API_KEY not found in environment variables")
      return Response.json(
        {
          error: "Search API key not configured. Please add EXA_API_KEY to environment variables.",
        },
        { status: 503 },
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
      const selection = selectModel(query, mode)
      modelSelection = {
        model: selection.model,
        reason: selection.reason,
        autoSelected: true,
      }
    }

    console.log(`[v0] Using model: ${modelSelection.model} (${modelSelection.reason})`)

    console.log("[v0] Cache temporarily disabled for testing")

    console.log("[v0] Performing web search for:", query, "mode:", mode)
    const searchResults = await searchWeb(query, mode === "deep" ? 8 : 5)
    console.log("[v0] Web search completed, found", searchResults.length, "results")

    const searchContext = formatSearchContext(searchResults)
    console.log("[v0] Formatted search context, length:", searchContext.length)

    const systemInstruction =
      mode === "deep"
        ? `You are Miami.ai, an advanced AI research assistant. Provide comprehensive, detailed answers with in-depth analysis. Use the provided web search results to give thorough explanations. Always cite your sources using [Source X] notation.`
        : `You are Miami.ai, a fast AI search assistant. Provide concise, accurate answers. Use the provided web search results to answer directly. Always cite your sources using [Source X] notation.`

    const combinedPrompt = `${systemInstruction}

Based on the following web search results, answer this question: "${query}"

Web Search Results:
${searchContext}

Provide a ${mode === "deep" ? "detailed and comprehensive" : "clear and concise"} answer, citing the sources you use.`

    console.log("[v0] Starting AI text generation with model:", modelSelection.model)

    try {
      const { text } = await generateText({
        model: modelSelection.model,
        prompt: combinedPrompt,
        maxTokens: mode === "deep" ? 2000 : 800,
        temperature: mode === "deep" ? 0.7 : 0.5,
      })

      console.log("[v0] AI generateText successful, response length:", text.length)

      if (userId && typeof userId === "string" && userId.length > 0) {
        try {
          await createSearchHistory(
            userId,
            query,
            text,
            searchResults.map((result, index) => ({
              title: result.title,
              url: result.url,
              snippet: result.text?.substring(0, 200) || "",
            })),
            mode,
            modelSelection.model,
            modelSelection.autoSelected,
            modelSelection.reason,
          )
          console.log("[v0] Search saved to history for user:", userId)
        } catch (error) {
          console.error("[v0] Failed to save search to history:", error)
          // Don't fail the request if history save fails
        }
      }

      // Increment rate limit
      await incrementRateLimit(userId && typeof userId === "string" && userId.length > 0 ? userId : null, ipAddress)

      // Create SSE stream in the format the client expects
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send citations
            const citationsData = JSON.stringify({
              type: "citations",
              content: searchResults.map((result, index) => ({
                id: index + 1,
                title: result.title,
                url: result.url,
                snippet: result.text?.substring(0, 200) || "",
              })),
            })
            controller.enqueue(encoder.encode(`data: ${citationsData}\n\n`))

            // Send model info
            const modelData = JSON.stringify({
              type: "model",
              content: {
                model: modelSelection.model,
                reason: modelSelection.reason,
                autoSelected: modelSelection.autoSelected,
              },
            })
            controller.enqueue(encoder.encode(`data: ${modelData}\n\n`))

            // Send the text response in chunks
            const chunkSize = 50
            for (let i = 0; i < text.length; i += chunkSize) {
              const chunk = text.slice(i, i + chunkSize)
              const textData = JSON.stringify({
                type: "text",
                content: chunk,
              })
              controller.enqueue(encoder.encode(`data: ${textData}\n\n`))
              // Small delay to simulate streaming
              await new Promise((resolve) => setTimeout(resolve, 10))
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          } catch (error) {
            console.error("[v0] Error in stream:", error)
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
    } catch (error) {
      console.error("[v0] Error creating AI response:", error)
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  } catch (error) {
    console.error("[v0] Search API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
