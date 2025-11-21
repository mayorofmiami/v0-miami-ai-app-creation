-- SEED DEFAULT CONFIGURATIONS
-- These are the baseline rate limits and settings

-- Rate limit defaults
INSERT INTO rate_limit_configs (feature, max_requests, window_seconds, description)
VALUES 
  ('search', 1000, 86400, 'AI search queries per day'),
  ('image_generation', 100, 86400, 'AI image generations per day'),
  ('free_search', 3, 3600, 'Free searches per hour for unauthenticated users')
ON CONFLICT (feature) DO NOTHING;
