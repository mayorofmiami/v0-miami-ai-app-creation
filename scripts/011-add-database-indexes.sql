-- Add comprehensive database indexes for performance

-- Indexes for search_history table
CREATE INDEX IF NOT EXISTS idx_search_history_thread_id ON search_history(thread_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON search_history(user_id, created_at DESC);

-- Indexes for threads table
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_user_updated ON threads(user_id, updated_at DESC);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Indexes for rate_limits table
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- Indexes for bookmarks table
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_search_id ON bookmarks(search_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);

-- Indexes for collections table
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_bookmarks_collection_id ON collection_bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_bookmarks_bookmark_id ON collection_bookmarks(bookmark_id);

-- Indexes for model_preferences table
CREATE INDEX IF NOT EXISTS idx_model_preferences_user_id ON model_preferences(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_search_history_thread_position ON search_history(thread_id, position_in_thread);
