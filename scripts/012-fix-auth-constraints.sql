-- Remove foreign key constraints that reference neon_auth.users_sync
-- This allows the app to work with Stack Auth (or any auth provider)

-- Drop foreign key constraint from threads table
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_user_id_fkey;

-- Drop foreign key constraint from search_history table  
ALTER TABLE search_history DROP CONSTRAINT IF EXISTS search_history_user_id_fkey;

-- Drop foreign key constraint from subscriptions table
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Drop foreign key constraint from usage_tracking table
ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey;

-- Drop foreign key constraint from model_preferences table (if it exists)
ALTER TABLE model_preferences DROP CONSTRAINT IF EXISTS model_preferences_user_id_fkey;

-- user_id columns are now just TEXT fields that reference Stack Auth user IDs
-- No foreign key constraints needed since Stack Auth manages users externally
