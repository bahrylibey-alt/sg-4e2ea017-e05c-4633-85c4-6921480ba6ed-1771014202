-- Create autopilot_tasks table for scheduled automation jobs
CREATE TABLE IF NOT EXISTS autopilot_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('traffic_generation', 'content_creation', 'link_optimization', 'campaign_optimization', 'email_automation', 'social_posting', 'ab_testing', 'fraud_detection')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  schedule_type TEXT NOT NULL DEFAULT 'once' CHECK (schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'continuous')),
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE autopilot_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own tasks" ON autopilot_tasks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own tasks" ON autopilot_tasks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own tasks" ON autopilot_tasks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own tasks" ON autopilot_tasks FOR DELETE USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_autopilot_tasks_user_id ON autopilot_tasks(user_id);
CREATE INDEX idx_autopilot_tasks_status ON autopilot_tasks(status);
CREATE INDEX idx_autopilot_tasks_next_run ON autopilot_tasks(next_run_at) WHERE status = 'pending';
CREATE INDEX idx_autopilot_tasks_campaign ON autopilot_tasks(campaign_id) WHERE campaign_id IS NOT NULL;

COMMENT ON TABLE autopilot_tasks IS 'Scheduled automation tasks that run continuously to drive traffic and optimize campaigns';