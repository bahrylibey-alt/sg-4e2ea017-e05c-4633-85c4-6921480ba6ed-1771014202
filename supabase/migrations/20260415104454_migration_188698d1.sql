-- Fix autopilot_scores table - add missing columns
ALTER TABLE autopilot_scores 
DROP COLUMN IF EXISTS next_steps;

-- The table already has insights (jsonb) which can store recommendations
-- Let's verify the structure is correct
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'autopilot_scores' 
ORDER BY ordinal_position;