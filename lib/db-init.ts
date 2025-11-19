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
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not configured")
      }

      console.log("[v0] Initializing database tables...")

      // Test database connection first with a simple query
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

      // 4. Create Council tables
      await sql`
        CREATE TABLE IF NOT EXISTS councils (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL DEFAULT 'custom',
          is_public BOOLEAN DEFAULT FALSE,
          uses_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS advisor_archetypes (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          archetype_key TEXT UNIQUE NOT NULL,
          display_name TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          default_icon TEXT,
          rarity TEXT DEFAULT 'common',
          is_premium BOOLEAN DEFAULT FALSE,
          default_ethics INTEGER DEFAULT 50,
          default_risk INTEGER DEFAULT 50,
          default_time_horizon INTEGER DEFAULT 50,
          default_ideology INTEGER DEFAULT 50,
          default_experience INTEGER DEFAULT 50,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS council_advisors (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          council_id TEXT NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
          archetype TEXT NOT NULL,
          display_name TEXT NOT NULL,
          position INTEGER NOT NULL,
          ethics_score INTEGER DEFAULT 50 CHECK (ethics_score >= 0 AND ethics_score <= 100),
          risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
          time_horizon_score INTEGER DEFAULT 50 CHECK (time_horizon_score >= 0 AND time_horizon_score <= 100),
          ideology_score INTEGER DEFAULT 50 CHECK (ideology_score >= 0 AND ideology_score <= 100),
          experience_score INTEGER DEFAULT 50 CHECK (experience_score >= 0 AND experience_score <= 100),
          personality_preset TEXT,
          model TEXT NOT NULL,
          system_prompt TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS council_debates (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          council_id TEXT REFERENCES councils(id) ON DELETE SET NULL,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
          question TEXT NOT NULL,
          status TEXT DEFAULT 'in_progress',
          verdict TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS council_debate_responses (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          debate_id TEXT NOT NULL REFERENCES council_debates(id) ON DELETE CASCADE,
          advisor_archetype TEXT NOT NULL,
          advisor_name TEXT NOT NULL,
          round_number INTEGER NOT NULL CHECK (round_number >= 1 AND round_number <= 3),
          content TEXT NOT NULL,
          model_used TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS council_predictions (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          debate_id TEXT NOT NULL REFERENCES council_debates(id) ON DELETE CASCADE,
          advisor_archetype TEXT NOT NULL,
          advisor_name TEXT NOT NULL,
          prediction_text TEXT NOT NULL,
          confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
          due_date TIMESTAMP WITH TIME ZONE NOT NULL,
          outcome TEXT DEFAULT 'pending',
          verification_notes TEXT,
          verified_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS council_votes (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          debate_id TEXT NOT NULL REFERENCES council_debates(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          round_number INTEGER NOT NULL,
          advisor_archetype TEXT NOT NULL,
          vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(debate_id, user_id, round_number, advisor_archetype)
        )
      `

      // 5. Create indexes for existing tables
      await sql`CREATE INDEX IF NOT EXISTS idx_model_preferences_user_id ON model_preferences(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address)`
      await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start)`
      await sql`CREATE INDEX IF NOT EXISTS idx_search_history_model_used ON search_history(model_used)`

      // 6. Create indexes for Council tables
      await sql`CREATE INDEX IF NOT EXISTS idx_councils_user ON councils(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_councils_type ON councils(type)`
      await sql`CREATE INDEX IF NOT EXISTS idx_council_advisors_council ON council_advisors(council_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_council_debates_user ON council_debates(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_council_debates_council ON council_debates(council_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_council_debate_responses_debate ON council_debate_responses(debate_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_council_predictions_debate ON council_predictions(debate_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_council_predictions_due_date ON council_predictions(due_date)`
      await sql`CREATE INDEX IF NOT EXISTS idx_council_votes_debate ON council_votes(debate_id)`

      // 7. Seed advisor archetypes
      await sql`
        INSERT INTO advisor_archetypes (archetype_key, display_name, description, category, default_icon, rarity, default_ethics, default_risk, default_time_horizon, default_ideology, default_experience)
        VALUES 
          ('visionary', 'The Visionary', 'CEO-level strategy and long-term vision', 'executive', '🚀', 'common', 70, 75, 90, 60, 70),
          ('guardian', 'The Guardian', 'CFO-level finance and risk management', 'executive', '🛡️', 'common', 80, 30, 50, 70, 75),
          ('amplifier', 'The Amplifier', 'CMO-level growth and marketing', 'executive', '📈', 'rare', 65, 70, 60, 50, 60),
          ('builder', 'The Builder', 'CTO-level technology and innovation', 'executive', '🔧', 'rare', 75, 65, 70, 45, 65),
          ('executor', 'The Executor', 'COO-level operations and execution', 'executive', '⚙️', 'rare', 70, 40, 40, 60, 70),
          ('sage', 'The Sage', 'Philosophical wisdom and deep thinking', 'wisdom', '🧙', 'common', 90, 50, 95, 50, 90),
          ('ethicist', 'The Ethicist', 'Moral reasoning and ethical guidance', 'wisdom', '⚖️', 'epic', 95, 20, 80, 40, 75),
          ('historian', 'The Historian', 'Past patterns and lessons learned', 'wisdom', '📚', 'epic', 75, 35, 90, 55, 85),
          ('oracle', 'The Oracle', 'Future possibilities and trend analysis', 'wisdom', '🔮', 'rare', 70, 60, 100, 45, 70),
          ('artist', 'The Artist', 'Creative expression and innovation', 'creative', '🎨', 'epic', 65, 80, 70, 30, 60),
          ('craftsperson', 'The Craftsperson', 'Design aesthetics and execution', 'creative', '✨', 'epic', 75, 50, 50, 50, 70),
          ('critic', 'The Critic', 'Analytical evaluation and standards', 'creative', '🎭', 'rare', 70, 40, 60, 60, 75),
          ('counselor', 'The Counselor', 'Emotional intelligence and empathy', 'life', '💚', 'common', 90, 30, 60, 40, 80),
          ('mentor', 'The Mentor', 'Experience-based guidance', 'life', '🌟', 'rare', 85, 45, 75, 55, 90),
          ('advocate', 'The Advocate', 'Stakeholder representation', 'life', '🤝', 'rare', 85, 40, 65, 35, 65),
          ('contrarian', 'The Contrarian', 'Challenges all assumptions', 'wild_card', '⚡', 'common', 60, 70, 50, 50, 70),
          ('realist', 'The Realist', 'Grounded pragmatic thinking', 'wild_card', '🎯', 'common', 75, 45, 40, 60, 75),
          ('optimist', 'The Optimist', 'Positive possibilities', 'wild_card', '☀️', 'epic', 80, 75, 80, 45, 60),
          ('pessimist', 'The Pessimist', 'Risk identification', 'wild_card', '🌧️', 'epic', 70, 20, 30, 65, 70)
        ON CONFLICT (archetype_key) DO NOTHING
      `

      // 8. Create cleanup function
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
      // If tables already exist, this is not a fatal error
      if (error?.message?.includes("already exists") || error?.message?.includes("duplicate column")) {
        console.log("[v0] Some tables already exist, continuing...")
        isInitialized = true
      } else {
        // For connection errors or other critical issues, don't set initialized
        console.error("[v0] Critical initialization error, will retry on next request")
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
