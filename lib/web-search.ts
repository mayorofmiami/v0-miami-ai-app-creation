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
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    console.error("[v0] SERPER_API_KEY not found in environment variables")
    throw new Error("SERPER_API_KEY is required for search functionality")
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: maxResults,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Serper API error:", response.status, errorText)
      throw new Error(`Serper API returned status ${response.status}`)
    }

    const data = await response.json()

    // Transform Serper results to our SearchResult format
    const results: SearchResult[] = (data.organic || []).slice(0, maxResults).map((result: any) => ({
      title: result.title || "Untitled",
      url: result.link,
      snippet: result.snippet || "",
      content: result.snippet || "", // Serper provides snippets, not full content
      publishedDate: result.date,
      author: undefined,
    }))

    return results
  } catch (error) {
    console.error("[v0] Serper search error:", error)
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
