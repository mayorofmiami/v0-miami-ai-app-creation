import "server-only"
import { sql } from "./db"

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
      console.log("[v0] Initializing database tables...")

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

      // 4. Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_model_preferences_user_id ON model_preferences(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start)`
      await sql`CREATE INDEX IF NOT EXISTS idx_search_history_model_used ON search_history(model_used)`

      // 5. Create cleanup function
      await sql`
        CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
        RETURNS void AS $$
        BEGIN
          DELETE FROM rate_limits 
          WHERE window_start < NOW() - INTERVAL '48 hours';
        END;
        $$ LANGUAGE plpgsql
      `

      console.log("[v0] Database tables initialized successfully")
      isInitialized = true
    } catch (error: any) {
      console.error("[v0] Database initialization error:", error?.message || error)
      // Don't set isInitialized to true on error, so it will retry next time
      throw error
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
