export type ModelId =
  | "auto"
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "anthropic/claude-3.5-sonnet"
  | "anthropic/claude-3.5-haiku"
  | "groq/llama-3.3-70b"
  | "groq/llama-3.1-8b"
  | "google/gemini-2.0-flash"

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  blobUrl?: string
  preview?: string
}

export interface AttachmentRateLimit {
  currentCount: number
  limit: number
  remaining: number
  resetAt: Date
}
