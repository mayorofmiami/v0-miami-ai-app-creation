import { tool } from "ai"
import { z } from "zod"
import { searchWeb } from "./web-search"
import { scrapeUrl } from "./firecrawl"
import { logger } from "./logger"

export const webSearchTool = tool({
  description:
    "Search the web for current information, news, facts, and data. Use this when you need up-to-date information or when the user asks about current events, statistics, recent news, or specific topics that require current data. This tool combines web search with deep content scraping for comprehensive results.",
  parameters: z.object({
    query: z.string().describe("The search query to look up on the web"),
    maxResults: z.number().optional().default(5).describe("Maximum number of search results to return (default: 5)"),
    deepScrape: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to scrape the top result for full content (default: true)"),
  }),
  execute: async ({ query, maxResults, deepScrape }) => {
    logger.log("Web search tool executing:", { query, maxResults, deepScrape })

    try {
      const results = await searchWeb(query, maxResults)

      if (results.length === 0) {
        return {
          success: false,
          error: "No search results found",
          fallback: "Unable to find relevant web results. Providing answer based on training data.",
        }
      }

      let scrapedContent = null
      if (deepScrape && results[0]?.url && process.env.FIRECRAWL_API_KEY) {
        try {
          logger.log("Scraping top result:", results[0].url)
          const scraped = await scrapeUrl(results[0].url)
          if (scraped.success && scraped.markdown) {
            scrapedContent = {
              url: results[0].url,
              title: scraped.metadata?.title || results[0].title,
              fullContent: scraped.markdown.substring(0, 5000),
              metadata: scraped.metadata,
            }
            logger.log("Successfully scraped content, length:", scraped.markdown.length)
          }
        } catch (error) {
          logger.error("Firecrawl scraping error:", error)
        }
      }

      return {
        success: true,
        results: results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          content: r.content?.substring(0, 1000),
          publishedDate: r.publishedDate,
        })),
        ...(scrapedContent && {
          scrapedContent: {
            source: scrapedContent.url,
            title: scrapedContent.title,
            fullContent: scrapedContent.fullContent,
            note: "Full page content scraped for comprehensive analysis",
          },
        }),
      }
    } catch (error) {
      logger.error("Web search tool error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Web search failed",
        fallback: "Unable to fetch current web results. Providing answer based on training data.",
      }
    }
  },
})

export const extractDataTool = tool({
  description: "Extract structured data from search results or text content into a specific schema",
  parameters: z.object({
    content: z.string().describe("The content to extract data from"),
    schema: z.enum(["facts", "people", "dates", "companies", "stats"]).describe("The type of data to extract"),
  }),
  execute: async ({ content, schema }) => {
    logger.log("Extracting structured data:", schema)
    // This will be implemented with streamObject in the API routes
    return {
      extracted: true,
      type: schema,
      note: "Data extraction initiated",
    }
  },
})
