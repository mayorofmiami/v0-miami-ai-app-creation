-- SQL script to clean up any corrupted rate limit data and start fresh

-- This script cleans up the rate_limits table to remove any corrupted data
-- Run this once to reset all rate limiting counters

BEGIN;

-- Delete all existing rate limit tracking (will be rebuilt automatically)
TRUNCATE TABLE rate_limits;

-- Reset any test/corrupted configs
DELETE FROM rate_limit_configs WHERE config_key LIKE '%test%' OR config_key LIKE '%unknown%';

-- Ensure we have proper default configs
INSERT INTO rate_limit_configs (config_key, config_type, applies_to, max_requests, window_seconds, description, is_active)
VALUES
  ('search_free', 'feature', 'free', 100, 86400, 'Search limit for free users', true),
  ('search_authenticated', 'feature', 'authenticated', 1000, 86400, 'Search limit for authenticated users', true),
  ('search_pro', 'feature', 'pro', 10000, 86400, 'Search limit for pro users', true),
  ('image_generation_free', 'feature', 'free', 10, 86400, 'Image generation for free users', true),
  ('image_generation_authenticated', 'feature', 'authenticated', 50, 86400, 'Image generation for authenticated users', true),
  ('image_generation_pro', 'feature', 'pro', 500, 86400, 'Image generation for pro users', true)
ON CONFLICT (config_key) DO UPDATE SET
  max_requests = EXCLUDED.max_requests,
  window_seconds = EXCLUDED.window_seconds,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- Verify the cleanup
SELECT 'Rate limit configs:' as status, COUNT(*) as count FROM rate_limit_configs WHERE is_active = true;
SELECT 'Rate limit tracking:' as status, COUNT(*) as count FROM rate_limits;
