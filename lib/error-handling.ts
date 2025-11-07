import { toast } from "@/lib/toast"
import type { User } from "@/types"

interface HandleSearchErrorParams {
  error: any
  user: User | null
  status: number
}

export function handleSearchError({ error, user, status }: HandleSearchErrorParams): string {
  if (status === 429) {
    if (error.type === "ai_gateway_rate_limit") {
      toast.error(
        "AI Service Temporarily Limited",
        "Our AI provider is experiencing high demand. Please try again in a few moments.",
        10000,
      )
      return "⚠️ AI Service Temporarily Limited\n\nOur AI provider is currently experiencing high demand. Please try again in a few moments. We apologize for the inconvenience."
    }

    const message = user
      ? "You've reached your daily search limit. Your limit will reset tomorrow."
      : "You've reached the free search limit. Sign up for more searches!"

    toast.error("Rate Limit Exceeded", message)
    return `⚠️ Rate limit exceeded. ${message}`
  }

  // Generic error
  toast.error("Search failed", error.error || "Please try again")
  return "Sorry, something went wrong. Please try again."
}

interface HandleImageErrorParams {
  error: any
  status: number
}

export function handleImageError({ error, status }: HandleImageErrorParams): string {
  if (status === 429) {
    const message = error.message || "You've reached your daily image generation limit."
    toast.error("Rate Limit Exceeded", message)
    return `⚠️ ${message}`
  }

  toast.error("Image generation failed", error.error || "Please try again")
  return "Sorry, image generation failed. Please try again."
}
