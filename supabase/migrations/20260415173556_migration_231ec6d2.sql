-- Check if next_steps column exists and add it if missing
ALTER TABLE autopilot_scores 
ADD COLUMN IF NOT EXISTS next_steps text;

-- Also check current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'autopilot_scores' 
  AND table_schema = 'public'
ORDER BY ordinal_position;