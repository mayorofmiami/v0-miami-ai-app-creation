-- Add model system tables and columns

-- 1. Add model-related columns to search_history
ALTER TABLE search_history 
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS auto_selected BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS selection_reason TEXT;

-- 2. Create model_preferences table for authenticated users
CREATE TABLE IF NOT EXISTS model_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  model_preference TEXT NOT NULL DEFAULT 'auto', -- 'auto' or 'manual'
  selected_model TEXT, -- null for auto, specific model for manual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE
);

-- 3. Create rate_limits table for tracking query limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT, -- nullable for unsigned users
  ip_address TEXT, -- for unsigned users
  query_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_query_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_or_ip_required CHECK (user_id IS NOT NULL OR ip_address IS NOT NULL)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_preferences_user_id ON model_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_search_history_model_used ON search_history(model_used);

-- 5. Create function to clean up old rate limit records (older than 48 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql;
