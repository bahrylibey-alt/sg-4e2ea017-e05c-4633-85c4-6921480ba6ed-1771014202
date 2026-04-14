-- Step 4: Add missing 'insights' column to autopilot_scores
ALTER TABLE autopilot_scores 
ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '{}'::jsonb;