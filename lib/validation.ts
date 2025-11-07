import { z } from "zod"

// Search mode validation
export const searchModeSchema = z.enum(["quick", "deep"])

// Content type validation
export const contentTypeSchema = z.enum(["search", "image"])

// Model ID validation
export const modelIdSchema = z.enum([
  "auto",
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3.5-sonnet",
  "claude-3.5-haiku",
  "gemini-2.0-flash",
  "grok-2-fast",
  "grok-2-turbo",
  "deepseek-r1",
])

// Attachment validation
export const attachmentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max
  url: z.string().url(),
})

// Conversation message schema for context memory
export const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

// Search request validation
export const searchRequestSchema = z.object({
  query: z.string().min(1, "Query is required").max(1000, "Query must be 1000 characters or less").trim(),
  mode: searchModeSchema.default("quick"),
  userId: z.string().uuid().optional(),
  selectedModel: modelIdSchema.optional(),
  attachments: z.array(attachmentSchema).max(5).optional(),
  conversationHistory: z.array(conversationMessageSchema).max(20).optional(),
  threadId: z.string().uuid().optional(), // Added threadId to track conversations
})

// Image generation request validation
export const imageGenerationRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(500, "Prompt must be 500 characters or less").trim(),
  userId: z.string().uuid().optional(),
})

// Model preference validation
export const modelPreferenceSchema = z.object({
  userId: z.string().uuid(),
  modelPreference: z.enum(["auto", "manual"]),
  selectedModel: modelIdSchema.nullable(),
})

// User ID validation (for various endpoints)
export const userIdSchema = z.object({
  userId: z.string().uuid(),
})

// Export types
export type SearchRequest = z.infer<typeof searchRequestSchema>
export type ImageGenerationRequest = z.infer<typeof imageGenerationRequestSchema>
export type ModelPreference = z.infer<typeof modelPreferenceSchema>

// Validation helper function
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        success: false,
        error: firstError.message || "Invalid input",
      }
    }
    return {
      success: false,
      error: "Validation failed",
    }
  }
}
