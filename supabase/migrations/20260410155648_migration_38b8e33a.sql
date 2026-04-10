-- ====================================================
-- INTELLIGENCE LAYER - ADD PERFORMANCE TRACKING
-- ====================================================

-- 1. ADD PERFORMANCE COLUMNS TO posted_content
ALTER TABLE posted_content
  ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ctr numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_per_click numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_score numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autopilot_state text DEFAULT 'testing',
  ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 50;

-- 2. ADD PERFORMANCE COLUMNS TO affiliate_links  
ALTER TABLE affiliate_links
  ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ctr numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_per_click numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_score numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autopilot_state text DEFAULT 'testing',
  ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS last_scaled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_killed_at timestamp with time zone;

-- 3. ADD PERFORMANCE COLUMNS TO generated_content
ALTER TABLE generated_content
  ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ctr numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_score numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autopilot_state text DEFAULT 'testing',
  ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 50;

-- Add state constraints
ALTER TABLE posted_content 
  DROP CONSTRAINT IF EXISTS posted_content_autopilot_state_check,
  ADD CONSTRAINT posted_content_autopilot_state_check 
  CHECK (autopilot_state IN ('testing', 'scaling', 'cooldown', 'killed'));

ALTER TABLE affiliate_links
  DROP CONSTRAINT IF EXISTS affiliate_links_autopilot_state_check,
  ADD CONSTRAINT affiliate_links_autopilot_state_check
  CHECK (autopilot_state IN ('testing', 'scaling', 'cooldown', 'killed'));

ALTER TABLE generated_content
  DROP CONSTRAINT IF EXISTS generated_content_autopilot_state_check,
  ADD CONSTRAINT generated_content_autopilot_state_check
  CHECK (autopilot_state IN ('testing', 'scaling', 'cooldown', 'killed'));