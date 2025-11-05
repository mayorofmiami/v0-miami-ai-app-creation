"use server"

export interface FirecrawlResult {
  success: boolean
  markdown?: string
  html?: string
  metadata?: {
    title?: string
    description?: string
    language?: string
    sourceURL?: string
  }
  error?: string
}

export async function scrapeUrl(url: string): Promise<FirecrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: "Firecrawl API key not configured",
    }
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
        timeout: 10000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      markdown: data.data?.markdown,
      html: data.data?.html,
      metadata: {
        title: data.data?.metadata?.title,
        description: data.data?.metadata?.description,
        language: data.data?.metadata?.language,
        sourceURL: data.data?.metadata?.sourceURL || url,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
