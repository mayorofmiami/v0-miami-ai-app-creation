import type { NextRequest } from "next/server"

export const runtime = "edge"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { query, mode } = await request.json()

    if (!query?.trim()) {
      return Response.json({ error: "Query is required" }, { status: 400 })
    }

    // Use Tavily for web search
    const tavilyApiKey = process.env.TAVILY_API_KEY
    if (!tavilyApiKey) {
      return Response.json({ error: "Search API not configured" }, { status: 500 })
    }

    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: mode === "deep" ? "advanced" : "basic",
        include_answer: true,
        include_raw_content: false,
        max_results: mode === "deep" ? 10 : 5,
      }),
    })

    if (!tavilyResponse.ok) {
      throw new Error("Search failed")
    }

    const searchData = await tavilyResponse.json()

    // Use Groq for AI response generation
    const groqApiKey = process.env.API_KEY_GROQ_API_KEY
    if (!groqApiKey) {
      return Response.json({ error: "AI API not configured" }, { status: 500 })
    }

    const context = searchData.results
      ?.slice(0, 5)
      .map((r: any) => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
      .join("\n\n")

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI search assistant. Provide clear, accurate answers based on the search results provided. Always cite your sources.",
          },
          {
            role: "user",
            content: `Question: ${query}\n\nSearch Results:\n${context}\n\nPlease provide a comprehensive answer based on these search results. Include relevant source citations.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    })

    if (!groqResponse.ok) {
      throw new Error("AI response generation failed")
    }

    const aiData = await groqResponse.json()
    const response = aiData.choices?.[0]?.message?.content || "No response generated"

    const sources = searchData.results?.slice(0, 5).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.substring(0, 200),
    }))

    return Response.json({
      response,
      sources,
      query,
      mode,
    })
  } catch (error) {
    console.error("[Search API Error]:", error)
    return Response.json({ error: "Failed to process search request" }, { status: 500 })
  }
}
