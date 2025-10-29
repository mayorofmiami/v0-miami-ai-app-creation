-- Add users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Update search_history to reference users table
ALTER TABLE search_history 
DROP CONSTRAINT IF EXISTS search_history_user_id_fkey;

ALTER TABLE search_history
ADD CONSTRAINT search_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update subscriptions to reference users table
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update usage_tracking to reference users table
ALTER TABLE usage_tracking
DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey;

ALTER TABLE usage_tracking
ADD CONSTRAINT usage_tracking_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
