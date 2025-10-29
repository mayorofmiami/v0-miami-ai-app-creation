-- Add bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_id TEXT NOT NULL REFERENCES search_history(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, search_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_search_id ON bookmarks(search_id);

-- Add shared_searches table for shareable links
CREATE TABLE IF NOT EXISTS shared_searches (
  id TEXT PRIMARY KEY,
  search_id TEXT NOT NULL REFERENCES search_history(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  view_count INTEGER DEFAULT 0
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shared_searches_token ON shared_searches(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_searches_search_id ON shared_searches(search_id);
