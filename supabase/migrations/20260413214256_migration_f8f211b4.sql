-- Add new status constraint with correct values
ALTER TABLE posted_content 
ADD CONSTRAINT posted_content_status_check 
CHECK (status = ANY (ARRAY['scheduled', 'posting', 'posted', 'failed', 'draft']));