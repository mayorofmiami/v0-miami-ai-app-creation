-- Reset rate limit for authenticated user
-- This script manually resets the rate limit counter for a specific user

UPDATE rate_limits
SET 
  query_count = 0,
  window_start = NOW(),
  last_query_at = NOW(),
  updated_at = NOW()
WHERE user_id = '6a99e7c2-0575-4691-8685-140c79513f80';

-- Verify the reset
SELECT 
  user_id,
  query_count,
  window_start,
  last_query_at
FROM rate_limits
WHERE user_id = '6a99e7c2-0575-4691-8685-140c79513f80';
