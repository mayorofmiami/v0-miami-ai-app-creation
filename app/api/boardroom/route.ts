import { streamText } from "ai"
import { createBoardSession, saveBoardResponse, getBoardResponses, completeBoardSession } from "@/lib/boardroom/db"
import { getPersonas, type BoardType } from "@/lib/boardroom/personas"
import { checkRateLimit } from "@/lib/rate-limit"
import { neon } from "@neondatabase/serverless"
import { createThread } from "@/lib/db"
import { webSearchTool } from "@/lib/tools"
import { logger } from "@/lib/logger"

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

    const rateLimit = await checkRateLimit(userId, "boardroom")
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: "Boardroom rate limit exceeded. Please try again later.",
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      )
    }

    const personas = getPersonas((boardType as BoardType) || "startup")

    let actualThreadId = threadId
    if (!threadId) {
      const title = `Boardroom: ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}`
      const thread = await createThread(userId, title)
      if (!thread) {
        return Response.json({ error: "Failed to create thread" }, { status: 500 })
      }
      actualThreadId = thread.id
    } else {
      const existingThread = await sql`SELECT id FROM threads WHERE id = ${threadId} AND user_id = ${userId}`
      if (existingThread.length === 0) {
        const title = `Boardroom: ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}`
        const thread = await createThread(userId, title)
        if (!thread) {
          return Response.json({ error: "Failed to create thread" }, { status: 500 })
        }
        actualThreadId = thread.id
      }
    }

    const session = await createBoardSession(userId, actualThreadId, query, boardType)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "session_start",
                sessionId: session.id,
                personas: personas.map((p) => ({ name: p.name, role: p.role, avatar: p.avatar, model: p.model })),
              })}\n\n`,
            ),
          )

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

          await completeBoardSession(session.id)

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          logger.error("Boardroom stream error", error)
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
    logger.error("Boardroom API error", error)
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
  const promises = personas.map(async (persona) => {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: "persona_start",
          persona: persona.name,
          round: 1,
          status: "Analyzing question...",
        })}\n\n`,
      ),
    )

    const result = streamText({
      model: persona.model,
      system: persona.systemPrompt,
      prompt: `Question: ${query}\n\nProvide your expert perspective based on your role. Be comprehensive but concise (max 3-4 paragraphs).`,
      maxTokens: 500,
      tools: {
        webSearch: webSearchTool,
      },
      maxSteps: 3,
      onStepFinish: ({ toolCalls }) => {
        if (toolCalls && toolCalls.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "persona_progress",
                persona: persona.name,
                status: "Researching sources...",
              })}\n\n`,
            ),
          )
        }
      },
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
  const allResponses = await getBoardResponses(sessionId, 1)

  const opinions = allResponses.map((r) => `${r.persona_name}: ${r.content}`).join("\n\n")

  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: "synthesis_progress",
        status: "Analyzing perspectives...",
      })}\n\n`,
    ),
  )

  const result = streamText({
    model: "openai/gpt-4o",
    system: "You are an impartial chairman synthesizing council opinions. Provide a balanced, structured synthesis.",
    prompt: `Question: ${query}\n\nHere are the council members' opinions:\n\n${opinions}\n\nProvide a balanced synthesis that:\n1. Summarizes key perspectives\n2. Identifies consensus areas\n3. Notes differing viewpoints\n4. Offers actionable recommendations\n\nKeep it concise and structured.`,
    maxTokens: 800,
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
