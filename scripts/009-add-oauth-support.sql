-- Add OAuth support to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider TEXT,
ADD COLUMN IF NOT EXISTS oauth_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Make password_hash nullable for OAuth users
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Add unique constraint for OAuth provider + ID combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth 
ON users(oauth_provider, oauth_id) 
WHERE oauth_provider IS NOT NULL;

-- Add index for faster OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
