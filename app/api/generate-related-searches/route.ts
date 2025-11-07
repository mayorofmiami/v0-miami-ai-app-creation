import { streamText } from "ai"

export const maxDuration = 10

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Query is required" }, { status: 400 })
    }

    console.log(`[v0] Generating related searches for: "${query}"`)

    const result = await streamText({
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

    let relatedText = ""
    for await (const chunk of result.textStream) {
      relatedText += chunk
    }

    try {
      const relatedSearches = JSON.parse(relatedText)
      if (Array.isArray(relatedSearches) && relatedSearches.length === 5) {
        console.log(`[v0] Generated ${relatedSearches.length} related searches`)
        return Response.json({ searches: relatedSearches })
      } else {
        throw new Error("Invalid format")
      }
    } catch (parseError) {
      console.error("[v0] Failed to parse related searches:", parseError)
      return Response.json({ error: "Failed to generate related searches" }, { status: 500 })
    }
  } catch (error) {
    console.error("Generate related searches error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
