-- MIAMI.AI CORE DATABASE SCHEMA
-- Clean, minimal schema for MVP features

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Threads: Conversation containers
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'search', -- 'search' or 'generate'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_created_at ON threads(created_at DESC);

-- Search History: Individual queries and responses
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  user_id TEXT,
  query TEXT NOT NULL,
  response TEXT,
  model_used TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'search',
  citations JSONB DEFAULT '[]'::jsonb,
  position_in_thread INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_history_thread_id ON search_history(thread_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- Bookmarks: User's saved searches
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  search_id UUID REFERENCES search_history(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE UNIQUE INDEX idx_bookmarks_user_search ON bookmarks(user_id, search_id);

-- Rate Limit Configs: What the limits are (per feature)
CREATE TABLE rate_limit_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature TEXT NOT NULL UNIQUE, -- 'search', 'image_generation', 'chat'
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate Limits: Actual usage counters (per user per feature)
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  ip_address TEXT,
  feature TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_user_feature ON rate_limits(user_id, feature);
CREATE INDEX idx_rate_limits_ip_feature ON rate_limits(ip_address, feature);
CREATE INDEX idx_rate_limits_window_end ON rate_limits(window_end);

-- Model Preferences: User's selected model
CREATE TABLE model_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  selected_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_model_preferences_user_id ON model_preferences(user_id);

-- Generated Images: AI image generation history
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  model_used TEXT NOT NULL,
  resolution TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);
