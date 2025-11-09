import { toast } from "@/lib/toast"
import type { User } from "@/types"

interface HandleSearchErrorParams {
  error: any
  user: User | null
  status: number
}

export function handleSearchError({ error, user, status }: HandleSearchErrorParams): string {
  // AI Gateway rate limits
  if (error.type === "ai_gateway_rate_limit" || error.type === "ai_gateway_error") {
    toast.error(
      "AI Service Temporarily Limited",
      "Free AI credits have rate limits due to abuse. Please try again in a few minutes, or contact support to purchase AI credits.",
      10000,
    )
    return `⚠️ **AI Service Temporarily Limited**
Vercel's free AI credits currently have rate limits in place due to abuse. This is a temporary measure while they work on a resolution.

**What you can do:**
- Wait a few minutes and try again
- Try a different AI model from the settings menu
- Contact support to purchase AI credits for unrestricted access

We apologize for the inconvenience!`
  }

  // Standard rate limits (429)
  if (status === 429) {
    const reason =
      error.reason ||
      `You've reached your query limit. ${user ? "Limit: 1000 queries per 24 hours" : "Sign in for more queries (1000/day) or wait for your limit to reset."}`

    toast.error("Rate Limit Exceeded", reason)

    return `⚠️ Rate limit exceeded. ${user ? "You've used all 1000 queries for today." : "Sign in for 1000 queries per day, or wait for your limit to reset (100 queries per 24 hours for unsigned users)."}`
  }

  // Configuration errors (503 with API key message)
  if (status === 503 && (error.error?.includes("API key") || error.message?.includes("API key"))) {
    toast.error("Configuration Error", "Please add SERPER_API_KEY to environment variables in the Vars section")
    return "⚠️ Search is not configured. Please add your SERPER_API_KEY to the environment variables."
  }

  // Generic errors
  const errorMessage = error.error || error.message || "Search failed"
  toast.error("Search failed", errorMessage)
  return "Sorry, something went wrong. Please try again."
}

interface HandleImageErrorParams {
  error: any
  status: number
}

export function handleImageError({ error, status }: HandleImageErrorParams): string {
  if (status === 429) {
    const message = error.message || "Rate limit exceeded"
    toast.error("Rate Limit Exceeded", message)
    return `⚠️ ${message}`
  }

  toast.error("Image generation failed", error.message || "Please try again")
  return "Sorry, image generation failed. Please try again."
}
