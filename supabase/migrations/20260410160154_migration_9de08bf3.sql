CREATE TABLE IF NOT EXISTS autopilot_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  priority_score DECIMAL(5,2) DEFAULT 0,
  autopilot_state TEXT NOT NULL DEFAULT 'testing' CHECK (autopilot_state IN ('testing', 'scaling', 'cooldown', 'killed')),
  next_post_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE autopilot_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their queue"
  ON autopilot_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);