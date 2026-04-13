CREATE TABLE IF NOT EXISTS autopilot_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posted_content(id) ON DELETE CASCADE,
  product_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
  ctr NUMERIC(5,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  revenue_per_click NUMERIC(10,2) DEFAULT 0,
  engagement_score NUMERIC(5,2) DEFAULT 0,
  performance_score NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE autopilot_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own scores" ON autopilot_scores FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own scores" ON autopilot_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own scores" ON autopilot_scores FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_autopilot_scores_user ON autopilot_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_scores_post ON autopilot_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_scores_product ON autopilot_scores(product_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_scores_performance ON autopilot_scores(performance_score DESC);