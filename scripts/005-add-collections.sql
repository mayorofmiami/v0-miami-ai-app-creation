-- Add collections table for organizing searches
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add collection_searches junction table
CREATE TABLE IF NOT EXISTS collection_searches (
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  search_id TEXT REFERENCES search_history(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (collection_id, search_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_searches_collection_id ON collection_searches(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_searches_search_id ON collection_searches(search_id);
