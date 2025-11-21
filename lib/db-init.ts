import "server-only"
import { sql } from "./db"
import { logger } from "./logger"

let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * Initialize database tables for the multi-model system
 * This function is idempotent and safe to call multiple times
 */
export async function initializeDatabase(): Promise<void> {
  // If already initialized, return immediately
  if (isInitialized) {
    return
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not configured")
      }

      logger.info("[v0] Initializing database tables...")

      try {
        await sql`SELECT 1 as test`
      } catch (connError: any) {
        throw new Error(`Error connecting to database: ${connError?.message || connError}`)
      }

      // 1. Add model-related columns to search_history
      await sql`
        ALTER TABLE search_history 
        ADD COLUMN IF NOT EXISTS model_used TEXT,
        ADD COLUMN IF NOT EXISTS auto_selected BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS selection_reason TEXT
      `

      // 2. Create model_preferences table
      await sql`
        CREATE TABLE IF NOT EXISTS model_preferences (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL UNIQUE,
          model_preference TEXT NOT NULL DEFAULT 'auto',
          selected_model TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // 3. Create rate_limits table
      await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT,
          ip_address TEXT,
          query_count INTEGER NOT NULL DEFAULT 0,
          window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_query_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT user_or_ip_required CHECK (user_id IS NOT NULL OR ip_address IS NOT NULL)
        )
      `

      // 5. Create indexes for existing tables
      await sql`CREATE INDEX IF NOT EXISTS idx_model_preferences_user_id ON model_preferences(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start)`
      await sql`CREATE INDEX IF NOT EXISTS idx_search_history_model_used ON search_history(model_used)`

      // 7. Create cleanup function
      await sql`
        CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
        RETURNS void AS $$
        BEGIN
          DELETE FROM rate_limits 
          WHERE window_start < NOW() - INTERVAL '48 hours';
        END;
        $$ LANGUAGE plpgsql
      `

      logger.info("[v0] Database tables initialized successfully")
      isInitialized = true
    } catch (error: any) {
      logger.error("[v0] Database initialization error:", error?.message || error)
      // If tables already exist, this is not a fatal error
      if (error?.message?.includes("already exists") || error?.message?.includes("duplicate column")) {
        logger.info("[v0] Some tables already exist, continuing...")
        isInitialized = true
      } else {
        // For connection errors or other critical issues, don't set initialized
        logger.error("[v0] Critical initialization error, will retry on next request")
      }
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * Reset the initialization state (useful for testing)
 */
export function resetInitialization() {
  isInitialized = false
  initializationPromise = null
}
