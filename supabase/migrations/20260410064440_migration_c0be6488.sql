-- Fix RLS policies for autopilot_cron_log - allow inserts for logging
DROP POLICY IF EXISTS "Users can view their own autopilot logs" ON autopilot_cron_log;
DROP POLICY IF EXISTS "Users can insert autopilot logs" ON autopilot_cron_log;
DROP POLICY IF EXISTS "Service can insert logs" ON autopilot_cron_log;

-- Allow authenticated users to insert logs (for autopilot execution)
CREATE POLICY "allow_authenticated_insert"
  ON autopilot_cron_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);

-- Allow users to view their own logs
CREATE POLICY "allow_user_select"
  ON autopilot_cron_log FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Ensure RLS is enabled
ALTER TABLE autopilot_cron_log ENABLE ROW LEVEL SECURITY;