import { streamText } from "ai"
import { createBoardSession, saveBoardResponse, getBoardResponses, completeBoardSession } from "@/lib/boardroom/db"
import { getPersonas, type BoardType } from "@/lib/boardroom/personas"
import { checkRateLimit } from "@/lib/redis"
import { neon } from "@neondatabase/serverless"
import { createThread } from "@/lib/db"

const sql = neon(process.env.DATABASE_URL!)

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { query, boardType, userId, threadId } = await req.json()

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Query is required" }, { status: 400 })
    }

    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(userId, 100)
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Rate limit exceeded. Please try again later.", remaining: rateLimit.remaining },
        { status: 429 },
      )
    }

    // Get personas for the selected board
    const personas = getPersonas((boardType as BoardType) || "startup")

    let actualThreadId = threadId
    if (!threadId) {
      // Generate a title for the boardroom session
      const title = `Boardroom: ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}`
      const thread = await createThread(userId, title)
      if (!thread) {
        return Response.json({ error: "Failed to create thread" }, { status: 500 })
      }
      actualThreadId = thread.id
    } else {
      // Verify thread exists in database
      const existingThread = await sql`SELECT id FROM threads WHERE id = ${threadId} AND user_id = ${userId}`
      if (existingThread.length === 0) {
        // Thread doesn't exist, create it
        const title = `Boardroom: ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}`
        const thread = await createThread(userId, title)
        if (!thread) {
          return Response.json({ error: "Failed to create thread" }, { status: 500 })
        }
        actualThreadId = thread.id
      }
    }

    // Create board session with valid thread_id
    const session = await createBoardSession(userId, actualThreadId, query, boardType)

    // Stream the debate
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session info
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "session_start",
                sessionId: session.id,
                personas: personas.map((p) => ({ name: p.name, role: p.role, avatar: p.avatar, model: p.model })),
              })}\n\n`,
            ),
          )

          // ROUND 1: Councilor Opinions (parallel)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "round_start",
                round: 1,
                title: "Councilor Opinions",
              })}\n\n`,
            ),
          )

          await streamRound1(controller, encoder, session.id, personas, query)

          // ROUND 2: Chairman's Synthesis
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "round_start",
                round: 2,
                title: "Chairman's Synthesis",
              })}\n\n`,
            ),
          )

          await streamSynthesis(controller, encoder, session.id, personas, query)
          // </CHANGE>

          // Mark session as complete
          await completeBoardSession(session.id)

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          console.error("[v0] Boardroom stream error:", error)
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
    console.error("[v0] Boardroom API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function streamRound1(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  sessionId: string,
  personas: any[],
  query: string,
) {
  // Generate all responses in parallel
  const promises = personas.map(async (persona) => {
    const result = streamText({
      model: persona.model,
      system: persona.systemPrompt,
      prompt: `Question: ${query}\n\nProvide your expert perspective based on your role. Structure your response with clear paragraphs separated by double line breaks. Be comprehensive but concise.`,
      maxOutputTokens: 500,
    })

    let fullText = ""
    for await (const chunk of result.textStream) {
      fullText += chunk
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "persona_chunk",
            persona: persona.name,
            round: 1,
            content: chunk,
          })}\n\n`,
        ),
      )
    }

    await saveBoardResponse(sessionId, persona.name, persona.model, 1, fullText)
    return fullText
  })

  await Promise.all(promises)
}

async function streamSynthesis(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  sessionId: string,
  personas: any[],
  query: string,
) {
  // Get all Round 1 responses
  const allResponses = await getBoardResponses(sessionId, 1)

  const opinions = allResponses.map((r) => `${r.persona_name}: ${r.content}`).join("\n\n")

  const result = streamText({
    model: "openai/gpt-4o",
    system:
      "You are an impartial chairman synthesizing council opinions. Structure your synthesis with clear sections.",
    prompt: `Question: ${query}\n\nHere are the council members' opinions:\n\n${opinions}\n\nProvide a balanced synthesis that:\n1. Summarizes the key perspectives from each council member\n2. Identifies common themes and consensus areas\n3. Notes any differing viewpoints or concerns\n4. Offers a clear, actionable recommendation considering all opinions\n\nStructure your response with clear paragraphs separated by double line breaks.`,
    maxOutputTokens: 800,
  })

  let fullText = ""
  for await (const chunk of result.textStream) {
    fullText += chunk
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: "synthesis_chunk",
          content: chunk,
        })}\n\n`,
      ),
    )
  }

  await saveBoardResponse(sessionId, "Chairman", "openai/gpt-4o", 2, fullText)
}
// </CHANGE>
