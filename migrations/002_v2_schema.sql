-- Content Command v2 Schema Migration
-- Generated: 2026-02-11
-- Run against Supabase project: lemwfeeevkoqfmuijjua

BEGIN;

-- ============================================================
-- 1. cc_templates (must come before cc_posts due to FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL,
  industry text,
  platforms text[] NOT NULL,
  prompt_template text NOT NULL,
  caption_template text,
  variables jsonb DEFAULT '[]',
  settings jsonb DEFAULT '{}',
  is_system boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. cc_posts — add missing columns
-- ============================================================
-- Add new columns (IF NOT EXISTS not supported for ADD COLUMN in all PG versions, use DO block)
DO $$
BEGIN
  -- timezone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='timezone') THEN
    ALTER TABLE cc_posts ADD COLUMN timezone text DEFAULT 'America/Chicago';
  END IF;
  -- template_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='template_id') THEN
    ALTER TABLE cc_posts ADD COLUMN template_id uuid REFERENCES cc_templates(id) ON DELETE SET NULL;
  END IF;
  -- generation_prompt
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='generation_prompt') THEN
    ALTER TABLE cc_posts ADD COLUMN generation_prompt text;
  END IF;
  -- generation_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='generation_id') THEN
    ALTER TABLE cc_posts ADD COLUMN generation_id text;
  END IF;
  -- publish_results (replaces posted_ids)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='publish_results') THEN
    ALTER TABLE cc_posts ADD COLUMN publish_results jsonb DEFAULT '{}';
  END IF;
  -- created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='created_by') THEN
    ALTER TABLE cc_posts ADD COLUMN created_by text DEFAULT 'system';
  END IF;
  -- approved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='approved_at') THEN
    ALTER TABLE cc_posts ADD COLUMN approved_at timestamptz;
  END IF;
  -- published_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='published_at') THEN
    ALTER TABLE cc_posts ADD COLUMN published_at timestamptz;
  END IF;
  -- version (optimistic locking)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='version') THEN
    ALTER TABLE cc_posts ADD COLUMN version integer DEFAULT 1;
  END IF;
END $$;

-- Migrate data from posted_ids to publish_results if posted_ids exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cc_posts' AND column_name='posted_ids') THEN
    UPDATE cc_posts SET publish_results = posted_ids WHERE posted_ids IS NOT NULL AND posted_ids != '{}'::jsonb;
  END IF;
END $$;

-- Update status check constraint to include new statuses
-- Drop old constraint if exists, add new one
DO $$
BEGIN
  -- Try to drop existing check constraint on status
  BEGIN
    ALTER TABLE cc_posts DROP CONSTRAINT IF EXISTS cc_posts_status_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  -- Add new constraint
  BEGIN
    ALTER TABLE cc_posts ADD CONSTRAINT cc_posts_status_check 
      CHECK (status IN ('idea', 'idea_approved', 'needs_photos', 'generating', 'review_photos', 'approved', 'scheduled', 'publishing', 'posted', 'partial', 'failed'));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Indexes for cc_posts
CREATE INDEX IF NOT EXISTS idx_cc_posts_status ON cc_posts(status);
CREATE INDEX IF NOT EXISTS idx_cc_posts_scheduled ON cc_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_cc_posts_status_scheduled ON cc_posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cc_posts_created ON cc_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cc_posts_content_hash ON cc_posts(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cc_posts_platforms ON cc_posts USING gin(platforms);

-- ============================================================
-- 3. cc_events
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_date date NOT NULL,
  event_type text NOT NULL DEFAULT 'custom'
    CHECK (event_type IN ('holiday', 'local', 'industry', 'weather', 'custom')),
  description text,
  content_ideas text[] DEFAULT '{}',
  auto_generate boolean DEFAULT false,
  template_id uuid REFERENCES cc_templates(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_events_date ON cc_events(event_date);

-- ============================================================
-- 4. cc_photos
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('companycam', 'astria', 'upload')),
  external_id text,
  original_url text NOT NULL,
  enhanced_url text,
  thumbnail_url text,
  project_id text,
  project_name text,
  project_address text,
  captured_at timestamptz,
  analysis jsonb,
  quality_score integer,
  fingerprint_normalized text,
  used_in_posts uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_photos_source ON cc_photos(source);
CREATE INDEX IF NOT EXISTS idx_cc_photos_quality ON cc_photos(quality_score DESC) WHERE quality_score >= 6;
CREATE INDEX IF NOT EXISTS idx_cc_photos_external ON cc_photos(source, external_id);
CREATE INDEX IF NOT EXISTS idx_cc_photos_fingerprint ON cc_photos(fingerprint_normalized) WHERE fingerprint_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cc_photos_project ON cc_photos(project_id);

-- ============================================================
-- 5. cc_platform_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_platform_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  display_name text NOT NULL,
  credentials jsonb NOT NULL DEFAULT '{}',
  config jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'error')),
  last_used_at timestamptz,
  expires_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. cc_publish_queue
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_publish_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES cc_posts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content text NOT NULL,
  photo_urls text[] DEFAULT '{}',
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  error_message text,
  external_post_id text,
  external_post_url text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_publish_queue_pending ON cc_publish_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_cc_publish_queue_retry ON cc_publish_queue(next_retry_at) WHERE status = 'failed' AND attempts < 3;
CREATE INDEX IF NOT EXISTS idx_cc_publish_queue_post ON cc_publish_queue(post_id);

-- ============================================================
-- 7. cc_activity_log
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  source text DEFAULT 'ui',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_activity_created ON cc_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cc_activity_entity ON cc_activity_log(entity_type, entity_id);

-- ============================================================
-- 8. RLS — permissive policies for single-tenant app
-- ============================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cc_posts','cc_events','cc_templates','cc_photos','cc_platform_tokens','cc_publish_queue','cc_activity_log']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', t);
    EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ============================================================
-- 9. Supabase Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE cc_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE cc_publish_queue;

COMMIT;
