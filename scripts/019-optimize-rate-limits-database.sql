-- Optimize rate_limits table for pure database rate limiting
-- This script ensures the rate_limits table has proper indexes and constraints

-- Add index on window_end for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

-- Add index on user_identifier and feature for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_feature ON rate_limits(user_identifier, feature);

-- Add composite index for the main query pattern
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON rate_limits(user_identifier, feature, window_end) 
WHERE window_end > NOW();

-- Create a function to clean up expired rate limit entries
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Ensure the unique constraint exists for upsert operations
-- This prevents duplicate entries for the same user/feature/window
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rate_limits_user_feature_window_unique'
  ) THEN
    ALTER TABLE rate_limits 
    ADD CONSTRAINT rate_limits_user_feature_window_unique 
    UNIQUE (user_identifier, feature, window_start);
  END IF;
END $$;

-- Add a comment explaining the new architecture
COMMENT ON TABLE rate_limits IS 'Pure database rate limiting - no Redis dependency. Stores rate limit counters with automatic window management.';
