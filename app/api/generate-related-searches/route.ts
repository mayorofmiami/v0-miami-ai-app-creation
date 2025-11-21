import { generateText } from "ai"
import { logger } from "@/lib/logger"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Query is required" }, { status: 400 })
    }

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Based on this search query, generate exactly 5 contextually relevant follow-up questions that naturally build upon the topic. 

Original query: "${query}"

Requirements:
- Make them genuinely interesting and useful
- Vary the depth and angle (some broad, some specific)
- Keep them concise (under 80 characters)
- Make them natural extensions of the original query
- Don't just rephrase the original query

Return ONLY a JSON array of 5 questions, no other text:
["question 1", "question 2", "question 3", "question 4", "question 5"]`,
      maxTokens: 200,
      temperature: 0.8,
    })

    try {
      let cleanedText = result.text.trim()

      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")

      // Find JSON array in response
      const jsonMatch = cleanedText.match(/\[.*\]/s)
      if (jsonMatch) {
        cleanedText = jsonMatch[0]
      }

      const relatedSearches = JSON.parse(cleanedText)

      if (Array.isArray(relatedSearches) && relatedSearches.length > 0) {
        return Response.json({ searches: relatedSearches.slice(0, 5) })
      } else {
        throw new Error("Invalid format")
      }
    } catch (parseError) {
      logger.error("Failed to parse related searches:", parseError)

      return Response.json({
        searches: [
          `More about ${query}`,
          `${query} explained`,
          `${query} examples`,
          `Latest ${query} news`,
          `${query} comparison`,
        ],
      })
    }
  } catch (error) {
    logger.error("Generate related searches error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"

    const { query } = await request.json().catch(() => ({ query: "this topic" }))
    return Response.json({
      searches: [
        `More about ${query}`,
        `${query} explained`,
        `${query} examples`,
        `Latest ${query} news`,
        `${query} trends`,
      ],
    })
  }
}
