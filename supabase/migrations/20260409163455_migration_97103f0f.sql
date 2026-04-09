-- Add last_autopilot_run column to user_settings if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS last_autopilot_run TIMESTAMP WITH TIME ZONE;