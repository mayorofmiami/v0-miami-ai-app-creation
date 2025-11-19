-- The Council: Database Schema for multi-advisor debate system
-- Phase 1: Core tables for councils, advisors, debates, and predictions

-- Main councils table: Stores user-created council configurations
CREATE TABLE IF NOT EXISTS councils (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom', -- 'custom', 'quick', 'preset'
  is_public BOOLEAN DEFAULT FALSE,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Council advisors: Individual advisors within a council
CREATE TABLE IF NOT EXISTS council_advisors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  council_id TEXT NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL, -- 'visionary', 'guardian', 'sage', etc.
  display_name TEXT NOT NULL, -- "The Visionary", "The Guardian"
  position INTEGER NOT NULL, -- Order in council (1, 2, 3)
  
  -- Slider values (0-100)
  ethics_score INTEGER DEFAULT 50 CHECK (ethics_score >= 0 AND ethics_score <= 100),
  risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  time_horizon_score INTEGER DEFAULT 50 CHECK (time_horizon_score >= 0 AND time_horizon_score <= 100),
  ideology_score INTEGER DEFAULT 50 CHECK (ideology_score >= 0 AND ideology_score <= 100),
  experience_score INTEGER DEFAULT 50 CHECK (experience_score >= 0 AND experience_score <= 100),
  
  personality_preset TEXT, -- 'steve_jobs', 'warren_buffett', null
  model TEXT NOT NULL, -- AI model selected based on experience
  system_prompt TEXT NOT NULL, -- Generated prompt from archetype + sliders
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Council debates: Individual debate sessions
CREATE TABLE IF NOT EXISTS council_debates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  council_id TEXT REFERENCES councils(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
  verdict TEXT, -- Final synthesis/verdict
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Debate responses: Individual advisor responses per round
CREATE TABLE IF NOT EXISTS council_debate_responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  debate_id TEXT NOT NULL REFERENCES council_debates(id) ON DELETE CASCADE,
  advisor_archetype TEXT NOT NULL,
  advisor_name TEXT NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number >= 1 AND round_number <= 3),
  content TEXT NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Predictions: Advisor predictions to track
CREATE TABLE IF NOT EXISTS council_predictions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  debate_id TEXT NOT NULL REFERENCES council_debates(id) ON DELETE CASCADE,
  advisor_archetype TEXT NOT NULL,
  advisor_name TEXT NOT NULL,
  prediction_text TEXT NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  outcome TEXT DEFAULT 'pending', -- 'pending', 'correct', 'incorrect', 'partial'
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Votes: User voting on advisor responses
CREATE TABLE IF NOT EXISTS council_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  debate_id TEXT NOT NULL REFERENCES council_debates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  advisor_archetype TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(debate_id, user_id, round_number, advisor_archetype)
);

-- Master archetype definitions
CREATE TABLE IF NOT EXISTS advisor_archetypes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  archetype_key TEXT UNIQUE NOT NULL, -- 'visionary', 'guardian'
  display_name TEXT NOT NULL, -- "The Visionary"
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'executive', 'wisdom', 'creative', 'life', 'wild_card'
  default_icon TEXT, -- lucide icon name or emoji
  rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- Default slider values
  default_ethics INTEGER DEFAULT 50,
  default_risk INTEGER DEFAULT 50,
  default_time_horizon INTEGER DEFAULT 50,
  default_ideology INTEGER DEFAULT 50,
  default_experience INTEGER DEFAULT 50,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_councils_user ON councils(user_id);
CREATE INDEX IF NOT EXISTS idx_councils_type ON councils(type);
CREATE INDEX IF NOT EXISTS idx_council_advisors_council ON council_advisors(council_id);
CREATE INDEX IF NOT EXISTS idx_council_debates_user ON council_debates(user_id);
CREATE INDEX IF NOT EXISTS idx_council_debates_council ON council_debates(council_id);
CREATE INDEX IF NOT EXISTS idx_council_debate_responses_debate ON council_debate_responses(debate_id);
CREATE INDEX IF NOT EXISTS idx_council_predictions_debate ON council_predictions(debate_id);
CREATE INDEX IF NOT EXISTS idx_council_predictions_due_date ON council_predictions(due_date);
CREATE INDEX IF NOT EXISTS idx_council_votes_debate ON council_votes(debate_id);

-- Seed master archetype data
INSERT INTO advisor_archetypes (archetype_key, display_name, description, category, default_icon, rarity, default_ethics, default_risk, default_time_horizon, default_ideology, default_experience)
VALUES 
  -- Executive Council (Business)
  ('visionary', 'The Visionary', 'CEO-level strategy and long-term vision', 'executive', '🚀', 'common', 70, 75, 90, 60, 70),
  ('guardian', 'The Guardian', 'CFO-level finance and risk management', 'executive', '🛡️', 'common', 80, 30, 50, 70, 75),
  ('amplifier', 'The Amplifier', 'CMO-level growth and marketing', 'executive', '📈', 'rare', 65, 70, 60, 50, 60),
  ('builder', 'The Builder', 'CTO-level technology and innovation', 'executive', '🔧', 'rare', 75, 65, 70, 45, 65),
  ('executor', 'The Executor', 'COO-level operations and execution', 'executive', '⚙️', 'rare', 70, 40, 40, 60, 70),
  
  -- Wisdom Council (Philosophy/Ethics)
  ('sage', 'The Sage', 'Philosophical wisdom and deep thinking', 'wisdom', '🧙', 'common', 90, 50, 95, 50, 90),
  ('ethicist', 'The Ethicist', 'Moral reasoning and ethical guidance', 'wisdom', '⚖️', 'epic', 95, 20, 80, 40, 75),
  ('historian', 'The Historian', 'Past patterns and lessons learned', 'wisdom', '📚', 'epic', 75, 35, 90, 55, 85),
  ('oracle', 'The Oracle', 'Future possibilities and trend analysis', 'wisdom', '🔮', 'rare', 70, 60, 100, 45, 70),
  
  -- Creative Council (Art/Design)
  ('artist', 'The Artist', 'Creative expression and innovation', 'creative', '🎨', 'epic', 65, 80, 70, 30, 60),
  ('craftsperson', 'The Craftsperson', 'Design aesthetics and execution', 'creative', '✨', 'epic', 75, 50, 50, 50, 70),
  ('critic', 'The Critic', 'Analytical evaluation and standards', 'creative', '🎭', 'rare', 70, 40, 60, 60, 75),
  
  -- Life Council (Personal)
  ('counselor', 'The Counselor', 'Emotional intelligence and empathy', 'life', '💚', 'common', 90, 30, 60, 40, 80),
  ('mentor', 'The Mentor', 'Experience-based guidance', 'life', '🌟', 'rare', 85, 45, 75, 55, 90),
  ('advocate', 'The Advocate', 'Stakeholder representation', 'life', '🤝', 'rare', 85, 40, 65, 35, 65),
  
  -- Wild Cards (Universal)
  ('contrarian', 'The Contrarian', 'Challenges all assumptions', 'wild_card', '⚡', 'common', 60, 70, 50, 50, 70),
  ('realist', 'The Realist', 'Grounded pragmatic thinking', 'wild_card', '🎯', 'common', 75, 45, 40, 60, 75),
  ('optimist', 'The Optimist', 'Positive possibilities', 'wild_card', '☀️', 'epic', 80, 75, 80, 45, 60),
  ('pessimist', 'The Pessimist', 'Risk identification', 'wild_card', '🌧️', 'epic', 70, 20, 30, 65, 70)
ON CONFLICT (archetype_key) DO NOTHING;
