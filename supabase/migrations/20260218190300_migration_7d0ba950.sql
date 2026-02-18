-- Optimization Logs (Track AI decisions persistently)
CREATE TABLE IF NOT EXISTS optimization_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  impact_score TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optimization_logs_campaign ON optimization_logs(campaign_id);