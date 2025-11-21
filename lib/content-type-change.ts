import type { ContentType } from "@/types"

/**
 * Handler for content type changes (search vs image generation)
 * This is a simple pass-through function that can be extended with
 * additional logic if needed (analytics, validation, etc.)
 */
export function handleContentTypeChange(type: ContentType) {
  // Currently just a pass-through, but provides a centralized place
  // to add logic like analytics tracking, validation, or side effects
  return type
}
