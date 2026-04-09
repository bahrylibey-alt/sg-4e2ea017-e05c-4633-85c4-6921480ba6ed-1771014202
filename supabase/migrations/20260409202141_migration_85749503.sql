-- Create a cron_jobs table to track when autopilot should run
CREATE TABLE IF NOT EXISTS autopilot_cron_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  results JSONB,
  error TEXT
);

-- Enable RLS on autopilot_cron_log
ALTER TABLE autopilot_cron_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view their own autopilot logs"
  ON autopilot_cron_log FOR SELECT
  USING (auth.uid() = user_id);