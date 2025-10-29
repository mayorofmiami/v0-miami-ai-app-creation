-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS admin_actions (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);

-- Set spencer@miami.ai as owner if exists
UPDATE users SET role = 'owner' WHERE email = 'spencer@miami.ai';
