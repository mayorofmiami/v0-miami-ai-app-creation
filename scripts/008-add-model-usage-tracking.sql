-- Create model_usage table for cost tracking
CREATE TABLE IF NOT EXISTS model_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_model_usage_created_at ON model_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage(model);
CREATE INDEX IF NOT EXISTS idx_model_usage_user_id ON model_usage(user_id);
