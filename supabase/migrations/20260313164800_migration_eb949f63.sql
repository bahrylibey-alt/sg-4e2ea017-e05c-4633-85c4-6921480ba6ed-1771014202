-- Create automation_metrics table for real-time tracking of autopilot performance
CREATE TABLE IF NOT EXISTS automation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_executed INTEGER DEFAULT 0,
  tasks_successful INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  content_generated INTEGER DEFAULT 0,
  content_posted INTEGER DEFAULT 0,
  traffic_generated INTEGER DEFAULT 0,
  clicks_generated INTEGER DEFAULT 0,
  conversions_generated INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  optimization_actions INTEGER DEFAULT 0,
  ai_decisions_made INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, campaign_id, metric_date)
);

-- Enable RLS
ALTER TABLE automation_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their automation metrics" ON automation_metrics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their automation metrics" ON automation_metrics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their automation metrics" ON automation_metrics FOR UPDATE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_automation_metrics_user ON automation_metrics(user_id);
CREATE INDEX idx_automation_metrics_campaign ON automation_metrics(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_automation_metrics_date ON automation_metrics(metric_date DESC);

COMMENT ON TABLE automation_metrics IS 'Daily metrics tracking the real performance of the autopilot system';