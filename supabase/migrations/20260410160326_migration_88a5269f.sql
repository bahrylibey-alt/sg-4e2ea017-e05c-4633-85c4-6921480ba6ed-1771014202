-- Add performance tracking columns to affiliate_links
ALTER TABLE affiliate_links
ADD COLUMN IF NOT EXISTS autopilot_state TEXT DEFAULT 'testing' CHECK (autopilot_state IN ('testing', 'scaling', 'cooldown', 'killed')),
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scaled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_killed_at TIMESTAMP WITH TIME ZONE;