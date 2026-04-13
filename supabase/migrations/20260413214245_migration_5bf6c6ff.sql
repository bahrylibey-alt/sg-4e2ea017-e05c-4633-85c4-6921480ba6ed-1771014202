-- Drop the restrictive status constraint
ALTER TABLE posted_content 
DROP CONSTRAINT IF EXISTS posted_content_status_check;