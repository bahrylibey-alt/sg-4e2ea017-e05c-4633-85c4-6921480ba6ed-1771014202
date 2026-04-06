-- Drop the problematic content_queue constraint entirely
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_status_check;

-- Add a simpler constraint that accepts any text
ALTER TABLE content_queue ADD CONSTRAINT content_queue_status_check CHECK (status IS NOT NULL AND status != '');

-- Verify it worked
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'content_queue'::regclass 
AND contype = 'c';