-- Add threads table for conversation management
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT,
  mode TEXT DEFAULT 'quick',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE
);

-- Add thread_id column to search_history
ALTER TABLE search_history 
ADD COLUMN IF NOT EXISTS thread_id TEXT REFERENCES threads(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS position_in_thread INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_thread_id ON search_history(thread_id);
CREATE INDEX IF NOT EXISTS idx_search_history_thread_position ON search_history(thread_id, position_in_thread);

-- Create function to auto-update thread updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE threads 
  SET updated_at = NOW() 
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update thread timestamp when search is added
CREATE TRIGGER update_thread_on_search
AFTER INSERT ON search_history
FOR EACH ROW
WHEN (NEW.thread_id IS NOT NULL)
EXECUTE FUNCTION update_thread_timestamp();
