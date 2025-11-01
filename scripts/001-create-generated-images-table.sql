-- Create generated_images table for storing AI-generated images
CREATE TABLE IF NOT EXISTS generated_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT, -- nullable for anonymous users
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL, -- Vercel Blob storage URL
  model_used TEXT NOT NULL,
  resolution TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT -- for anonymous rate limiting
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_ip_address ON generated_images(ip_address);
