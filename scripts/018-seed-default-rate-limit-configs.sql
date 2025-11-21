-- Seed default rate limit configurations
-- This ensures the app always has fallback configs even if admin hasn't configured them

INSERT INTO rate_limit_configs (
  config_key, 
  config_type, 
  max_requests, 
  window_seconds, 
  applies_to, 
  description, 
  is_active
)
VALUES 
  -- Global daily limits
  ('global_free', 'global', 100, 86400, 'free', 'Daily search limit for anonymous users', true),
  ('global_authenticated', 'global', 1000, 86400, 'authenticated', 'Daily search limit for logged-in users', true),
  ('global_pro', 'global', 10000, 86400, 'pro', 'Daily search limit for pro users', true),
  
  -- Image generation limits
  ('feature_image_generation_free', 'feature', 3, 86400, 'free', 'Daily image generation for anonymous users', true),
  ('feature_image_generation_authenticated', 'feature', 50, 86400, 'authenticated', 'Daily image generation for logged-in users', true),
  ('feature_image_generation_pro', 'feature', 500, 86400, 'pro', 'Daily image generation for pro users', true),
  
  -- Search feature limits (same as global for now)
  ('feature_search_free', 'feature', 100, 86400, 'free', 'Daily searches for anonymous users', true),
  ('feature_search_authenticated', 'feature', 1000, 86400, 'authenticated', 'Daily searches for logged-in users', true),
  ('feature_search_pro', 'feature', 10000, 86400, 'pro', 'Daily searches for pro users', true)
ON CONFLICT (config_key) DO UPDATE SET
  max_requests = EXCLUDED.max_requests,
  window_seconds = EXCLUDED.window_seconds,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify configs were created
SELECT config_key, max_requests, window_seconds, applies_to, is_active
FROM rate_limit_configs
ORDER BY config_type, applies_to;
