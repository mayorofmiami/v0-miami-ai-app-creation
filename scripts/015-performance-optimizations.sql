-- Phase 1: Performance Optimizations
-- This script adds composite indexes for common query patterns
-- and optimizes database performance across the application

-- ============================================
-- COMPOSITE INDEXES FOR search_history
-- ============================================

-- Optimize queries that filter by user_id AND thread_id
CREATE INDEX IF NOT EXISTS idx_search_history_user_thread_date 
  ON search_history(user_id, thread_id, created_at DESC) 
  WHERE thread_id IS NOT NULL;

-- Optimize thread message retrieval (frequently used)
CREATE INDEX IF NOT EXISTS idx_search_history_thread_position 
  ON search_history(thread_id, position_in_thread ASC) 
  WHERE thread_id IS NOT NULL;

-- Optimize user search history with mode filtering
CREATE INDEX IF NOT EXISTS idx_search_history_user_mode 
  ON search_history(user_id, mode, created_at DESC);

-- ============================================
-- COMPOSITE INDEXES FOR bookmarks
-- ============================================

-- Optimize user bookmarks with date sorting
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created_search 
  ON bookmarks(user_id, created_at DESC, search_id);

-- Optimize bookmark lookups by search_id
CREATE INDEX IF NOT EXISTS idx_bookmarks_search_user 
  ON bookmarks(search_id, user_id);

-- ============================================
-- COMPOSITE INDEXES FOR rate_limits
-- ============================================

-- Optimize rate limit checks with window filtering
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_window 
  ON rate_limits(user_id, window_start DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_window 
  ON rate_limits(ip_address, window_start DESC) 
  WHERE ip_address IS NOT NULL AND user_id IS NULL;

-- ============================================
-- COMPOSITE INDEXES FOR collections
-- ============================================

-- Optimize collection queries by user
CREATE INDEX IF NOT EXISTS idx_collections_user_created 
  ON collections(user_id, created_at DESC);

-- Optimize collection search queries
CREATE INDEX IF NOT EXISTS idx_collection_searches_collection_added 
  ON collection_searches(collection_id, added_at DESC);

-- ============================================
-- COMPOSITE INDEXES FOR threads
-- ============================================

-- Optimize thread listings with message count
CREATE INDEX IF NOT EXISTS idx_threads_user_updated 
  ON threads(user_id, updated_at DESC);

-- ============================================
-- COMPOSITE INDEXES FOR model tracking
-- ============================================

-- Optimize model usage queries
CREATE INDEX IF NOT EXISTS idx_model_usage_user_date 
  ON model_usage(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_usage_model_date 
  ON model_usage(model_name, created_at DESC);

-- ============================================
-- COMPOSITE INDEXES FOR subscriptions
-- ============================================

-- Optimize subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period_end 
  ON subscriptions(status, current_period_end DESC) 
  WHERE status = 'active';

-- ============================================
-- COMPOSITE INDEXES FOR admin/blog
-- ============================================

-- Optimize blog post queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published 
  ON blog_posts(status, published_at DESC NULLS LAST);

-- Optimize blog post slug lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug 
  ON blog_posts(slug) 
  WHERE status = 'published';

-- ============================================
-- QUERY PERFORMANCE ANALYSIS
-- ============================================

-- To analyze query performance after implementing indexes, run:
-- EXPLAIN ANALYZE SELECT ... (your query here)

-- Example analysis queries:
-- EXPLAIN ANALYZE SELECT * FROM search_history WHERE user_id = 'xxx' AND thread_id = 'yyy' ORDER BY created_at DESC;
-- EXPLAIN ANALYZE SELECT * FROM bookmarks WHERE user_id = 'xxx' ORDER BY created_at DESC LIMIT 100;

-- ============================================
-- MAINTENANCE NOTES
-- ============================================

-- These indexes significantly improve query performance but:
-- 1. Slightly slow down INSERT operations (trade-off is worth it)
-- 2. Require occasional VACUUM and ANALYZE for optimization
-- 3. Should be monitored for usage with pg_stat_user_indexes

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
