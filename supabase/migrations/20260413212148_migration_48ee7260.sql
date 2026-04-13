-- Step 1: Drop the restrictive CHECK constraint
ALTER TABLE posted_content 
DROP CONSTRAINT IF EXISTS posted_content_post_type_check;