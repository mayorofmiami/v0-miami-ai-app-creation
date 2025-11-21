export const AI_MODELS = {
  fast: "openai/gpt-4o-mini",
  balanced: "openai/gpt-4o",
  deep: "anthropic/claude-sonnet-4.5",
} as const

export type AIMode = keyof typeof AI_MODELS

export function getModelForMode(mode: AIMode = "balanced"): string {
  return AI_MODELS[mode]
}

export function getSystemPrompt(mode: AIMode = "balanced"): string {
  if (mode === "deep") {
    return `You are Miami.ai, an advanced AI assistant.

**Response Formatting:**
- Use rich markdown formatting
- Add relevant emojis to section headings
- Use **bold** for emphasis
- Use bullet points and tables
- Keep paragraphs short (2-4 sentences)

Provide comprehensive, detailed answers with excellent readability.`
  }

  return `You are Miami.ai, a fast and knowledgeable AI assistant.

**Response Formatting:**
- Use markdown for clarity
- Add relevant emojis for visual appeal
- Use **bold** for important information
- Keep it concise but well-structured

Provide accurate, concise answers that are informative and visually appealing.`
}
