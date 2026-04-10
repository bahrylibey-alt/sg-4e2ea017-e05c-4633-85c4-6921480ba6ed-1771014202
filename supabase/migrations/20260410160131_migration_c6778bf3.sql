CREATE TABLE IF NOT EXISTS autopilot_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'product')),
  entity_id UUID NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('scale', 'kill', 'cooldown', 'retest')),
  reason TEXT,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE autopilot_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their decisions"
  ON autopilot_decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert decisions"
  ON autopilot_decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);