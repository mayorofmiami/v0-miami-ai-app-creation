import { logger } from "./logger"
import { sql } from "@neondatabase/serverless"

// Model costs per 1M tokens (input / output)
export const MODEL_COSTS = {
  "openai/gpt-4o": { input: 5.0, output: 15.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
  "anthropic/claude-3.5-sonnet": { input: 3.0, output: 15.0 },
  "anthropic/claude-3.5-haiku": { input: 0.8, output: 4.0 },
  "google/gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "groq/llama-3.1-8b": { input: 0.05, output: 0.08 },
  "groq/llama-3.3-70b": { input: 0.59, output: 0.79 },
}

export interface UsageRecord {
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: Date
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS]
  if (!costs) return 0

  const inputCost = (inputTokens / 1_000_000) * costs.input
  const outputCost = (outputTokens / 1_000_000) * costs.output

  return inputCost + outputCost
}

let tableExists: boolean | null = null

async function checkTableExists(): Promise<boolean> {
  if (tableExists !== null) return tableExists

  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'model_usage'
      ) as exists
    `
    tableExists = result[0]?.exists || false

    if (!tableExists) {
      logger.warn(
        "model_usage table does not exist. Run scripts/008-add-model-usage-tracking.sql to enable cost tracking.",
      )
    }

    return tableExists
  } catch (error) {
    logger.error("Failed to check if model_usage table exists:", error)
    tableExists = false
    return false
  }
}

export async function trackModelUsage(
  userId: string | null,
  model: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  try {
    const exists = await checkTableExists()
    if (!exists) {
      // Silently skip tracking if table doesn't exist
      return
    }

    const cost = calculateCost(model, inputTokens, outputTokens)

    await sql`
      INSERT INTO model_usage (user_id, model, input_tokens, output_tokens, cost, created_at)
      VALUES (${userId}, ${model}, ${inputTokens}, ${outputTokens}, ${cost}, NOW())
    `
  } catch (error) {
    logger.error("Failed to track model usage:", error)
    // Don't throw - tracking failures shouldn't break searches
  }
}

export async function getModelUsageStats(days = 30) {
  try {
    const exists = await checkTableExists()
    if (!exists) {
      return []
    }

    const stats = await sql`
      SELECT 
        model,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost) as total_cost
      FROM model_usage
      WHERE created_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY model
      ORDER BY total_cost DESC
    `

    return stats
  } catch (error) {
    logger.error("Failed to get model usage stats:", error)
    return []
  }
}
