-- ==========================================
-- PERMANENT FIX: Create rate_limit_configs table
-- ==========================================
-- This table stores rate limit configuration that can be managed via admin panel
-- The system works with fallback defaults if this table is missing, 
-- but the table is REQUIRED for the admin panel to function properly

CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  config_key TEXT NOT NULL UNIQUE,
  config_type TEXT NOT NULL CHECK (config_type IN ('global', 'model', 'feature')),
  max_requests INTEGER NOT NULL CHECK (max_requests > 0),
  window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all', 'free', 'authenticated', 'pro')),
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert default rate limit configurations
-- These provide sensible defaults that can be modified via admin panel
INSERT INTO rate_limit_configs (config_key, config_type, max_requests, window_seconds, applies_to, description) VALUES
  -- Global rate limits (daily)
  ('global_free', 'global', 100, 86400, 'free', 'Global daily limit for unauthenticated users'),
  ('global_authenticated', 'global', 1000, 86400, 'authenticated', 'Global daily limit for authenticated free users'),
  ('global_pro', 'global', 10000, 86400, 'pro', 'Global daily limit for pro users'),
  
  -- Model-specific rate limits (per hour)
  ('model_gpt4o', 'model', 100, 3600, 'authenticated', 'GPT-4o hourly limit for authenticated users'),
  ('model_claude_sonnet', 'model', 100, 3600, 'authenticated', 'Claude Sonnet hourly limit'),
  ('model_claude_haiku', 'model', 200, 3600, 'authenticated', 'Claude Haiku hourly limit'),
  ('model_gpt4o_mini', 'model', 500, 3600, 'authenticated', 'GPT-4o Mini hourly limit'),
  ('model_gemini_flash', 'model', 1000, 3600, 'authenticated', 'Gemini Flash hourly limit'),
  ('model_llama_8b', 'model', 1000, 3600, 'authenticated', 'Llama 8B hourly limit'),
  ('model_llama_70b', 'model', 500, 3600, 'authenticated', 'Llama 70B hourly limit'),
  
  -- Feature-specific rate limits (daily)
  ('feature_image_generation_free', 'feature', 3, 86400, 'free', 'Daily image generation for free users'),
  ('feature_image_generation_auth', 'feature', 50, 86400, 'authenticated', 'Daily image generation for authenticated users'),
  ('feature_image_generation_pro', 'feature', 500, 86400, 'pro', 'Daily image generation for pro users')
ON CONFLICT (config_key) DO NOTHING;

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_key ON rate_limit_configs(config_key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_type_applies ON rate_limit_configs(config_type, applies_to) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_active ON rate_limit_configs(is_active);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limit_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rate_limit_configs_timestamp
BEFORE UPDATE ON rate_limit_configs
FOR EACH ROW
EXECUTE FUNCTION update_rate_limit_configs_updated_at();

-- Verify the table was created successfully
DO $$
DECLARE
  config_count INTEGER;
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rate_limit_configs') THEN
    RAISE EXCEPTION 'Failed to create rate_limit_configs table';
  END IF;
  
  -- Count configurations
  SELECT COUNT(*) INTO config_count FROM rate_limit_configs;
  RAISE NOTICE 'rate_limit_configs table created successfully with % default configurations', config_count;
END $$;
