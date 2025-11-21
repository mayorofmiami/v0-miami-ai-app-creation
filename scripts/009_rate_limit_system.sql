-- Create rate limit configuration table
CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  config_key TEXT NOT NULL UNIQUE,
  config_type TEXT NOT NULL, -- 'global', 'model', 'feature'
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL, -- Time window in seconds
  applies_to TEXT NOT NULL, -- 'all', 'free', 'authenticated', 'pro'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default rate limit configurations
INSERT INTO rate_limit_configs (config_key, config_type, max_requests, window_seconds, applies_to, description) VALUES
  -- Global rate limits
  ('global_free', 'global', 100, 86400, 'free', 'Global daily limit for unauthenticated users'),
  ('global_authenticated', 'global', 1000, 86400, 'authenticated', 'Global daily limit for authenticated free users'),
  ('global_pro', 'global', 10000, 86400, 'pro', 'Global daily limit for pro users'),
  
  -- Model-specific rate limits (per hour)
  ('model_gpt4o', 'model', 100, 3600, 'authenticated', 'GPT-4o hourly limit'),
  ('model_claude_sonnet', 'model', 100, 3600, 'authenticated', 'Claude Sonnet hourly limit'),
  ('model_claude_haiku', 'model', 200, 3600, 'authenticated', 'Claude Haiku hourly limit'),
  ('model_gpt4o_mini', 'model', 500, 3600, 'authenticated', 'GPT-4o Mini hourly limit'),
  ('model_gemini_flash', 'model', 1000, 3600, 'authenticated', 'Gemini Flash hourly limit'),
  ('model_llama_8b', 'model', 1000, 3600, 'authenticated', 'Llama 8B hourly limit'),
  ('model_llama_70b', 'model', 500, 3600, 'authenticated', 'Llama 70B hourly limit'),
  
  -- Feature-specific rate limits
  ('feature_image_generation_free', 'feature', 3, 86400, 'free', 'Daily image generation for free users'),
  ('feature_image_generation_auth', 'feature', 50, 86400, 'authenticated', 'Daily image generation for authenticated users'),
  ('feature_image_generation_pro', 'feature', 500, 86400, 'pro', 'Daily image generation for pro users')
ON CONFLICT (config_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_key ON rate_limit_configs(config_key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_type ON rate_limit_configs(config_type, applies_to);
