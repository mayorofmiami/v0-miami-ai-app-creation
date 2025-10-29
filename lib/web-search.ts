import "server-only"
import Exa from "exa-js"

export interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
  publishedDate?: string
  author?: string
}

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const apiKey = process.env.EXA_API_KEY

  if (!apiKey) {
    console.error("[v0] EXA_API_KEY not found in environment variables")
    throw new Error("EXA_API_KEY is required for search functionality")
  }

  try {
    const exa = new Exa(apiKey)

    // Use Exa's searchAndContents to get both search results and content
    const response = await exa.searchAndContents(query, {
      numResults: maxResults,
      text: true, // Get text content
      highlights: true, // Get highlights for snippets
      type: "neural", // Use neural search for better semantic understanding
    })

    // Transform Exa results to our SearchResult format
    const results: SearchResult[] = response.results.map((result) => ({
      title: result.title || "Untitled",
      url: result.url,
      snippet: result.highlights?.[0] || result.text?.substring(0, 200) || "",
      content: result.text || "",
      publishedDate: result.publishedDate,
      author: result.author,
    }))

    return results
  } catch (error) {
    console.error("[v0] Exa search error:", error)
    throw new Error("Failed to perform web search")
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
