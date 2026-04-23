-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view own content" ON generated_content;
DROP POLICY IF EXISTS "Users can view their own generated content" ON generated_content;