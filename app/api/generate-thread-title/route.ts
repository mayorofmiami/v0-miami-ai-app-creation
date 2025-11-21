import { generateText } from "ai"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return Response.json({ error: "Query is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Generate a concise, descriptive title (max 6 words) for this search query. Only return the title, nothing else.

Query: "${query}"

Examples:
- "Miami AI startups 2025" (not "What are the Miami AI startups in 2025?")
- "Best Miami coworking spaces" (not "Where can I find coworking spaces?")
- "Ford F-150 reliability issues" (not "Tell me about Ford reliability")

Title:`,
      maxTokens: 20,
      temperature: 0.3,
    })

    const title = text.trim().replace(/^["']|["']$/g, "")

    return Response.json({ title })
  } catch (error) {
    logger.error("Error generating thread title:", error)
    return Response.json({ error: "Failed to generate title" }, { status: 500 })
  }
}
