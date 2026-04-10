-- Add created_at column to autopilot_cron_log if missing
ALTER TABLE autopilot_cron_log
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at for completeness
ALTER TABLE autopilot_cron_log
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();