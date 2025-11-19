-- Create boardroom tables for multi-AI debate feature

-- Board sessions are linked to threads
CREATE TABLE IF NOT EXISTS board_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  board_type VARCHAR(50), -- 'startup', 'ethical', 'creative', 'custom'
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store each persona's responses
CREATE TABLE IF NOT EXISTS board_responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES board_sessions(id) ON DELETE CASCADE,
  persona_name VARCHAR(100) NOT NULL, -- 'CFO', 'CMO', 'CEO', etc.
  persona_model VARCHAR(50) NOT NULL, -- 'gpt-4o', 'claude-3.5-sonnet', etc.
  round_number INT NOT NULL, -- 1 = opening, 2 = debate, 3 = synthesis
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user votes on arguments
CREATE TABLE IF NOT EXISTS board_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES board_sessions(id) ON DELETE CASCADE,
  response_id TEXT NOT NULL REFERENCES board_responses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  vote_type VARCHAR(20) NOT NULL, -- 'upvote', 'downvote'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(response_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_sessions_user ON board_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_board_sessions_thread ON board_sessions(thread_id);
CREATE INDEX IF NOT EXISTS idx_board_responses_session ON board_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_board_votes_session ON board_votes(session_id);
