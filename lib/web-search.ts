import "server-only"

export interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
  publishedDate?: string
  author?: string
}

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    console.error("[v0] TAVILY_API_KEY not found in environment variables")
    throw new Error("TAVILY_API_KEY is required for search functionality")
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: maxResults,
        search_depth: "basic", // Use "advanced" for more comprehensive results
        include_answer: false, // We'll let the AI generate the answer
        include_raw_content: true, // Get full content for better context
        include_images: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Tavily API error:", response.status, errorText)
      throw new Error(`Tavily API returned status ${response.status}`)
    }

    const data = await response.json()

    // Transform Tavily results to our SearchResult format
    const results: SearchResult[] = (data.results || []).map((result: any) => ({
      title: result.title || "Untitled",
      url: result.url,
      snippet: result.content?.substring(0, 200) || "",
      content: result.raw_content || result.content || "",
      publishedDate: result.published_date,
      author: undefined, // Tavily doesn't provide author info
    }))

    return results
  } catch (error) {
    console.error("[v0] Tavily search error:", error)
    throw new Error(`Failed to perform web search: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export function formatSearchContext(results: SearchResult[]): string {
  const MAX_CONTENT_LENGTH = 3000 // Max characters per result

  return results
    .map((result, index) => {
      let context = `[Source ${index + 1}] ${result.title}\nURL: ${result.url}\n`
      if (result.author) context += `Author: ${result.author}\n`
      if (result.publishedDate) context += `Published: ${result.publishedDate}\n`

      // Truncate content to prevent context window overflow
      const content = result.content || result.snippet
      const truncatedContent =
        content.length > MAX_CONTENT_LENGTH ? content.substring(0, MAX_CONTENT_LENGTH) + "..." : content

      context += `${truncatedContent}\n`
      return context
    })
    .join("\n")
}
