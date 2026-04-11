-- Add missing columns to content_dna
ALTER TABLE content_dna ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE content_dna ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE content_dna ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;
ALTER TABLE content_dna ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0;
ALTER TABLE content_dna ADD COLUMN IF NOT EXISTS ctr NUMERIC DEFAULT 0;
ALTER TABLE content_dna ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'TESTING';

-- Create content_performance_tracking table
CREATE TABLE IF NOT EXISTS content_performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  hook_score NUMERIC,
  curiosity_score NUMERIC,
  clarity_score NUMERIC,
  emotion_score NUMERIC,
  platform_optimized BOOLEAN,
  humanization_applied BOOLEAN,
  validation_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_performance_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own performance tracking" ON content_performance_tracking FOR ALL USING (auth.uid() = user_id);