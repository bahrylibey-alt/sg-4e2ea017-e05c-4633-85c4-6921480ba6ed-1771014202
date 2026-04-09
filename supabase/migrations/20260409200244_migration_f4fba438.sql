-- Fix posted_content RLS policies - use user_id directly, not campaigns
DROP POLICY IF EXISTS "Users can view their own posted content" ON posted_content;
DROP POLICY IF EXISTS "Users can insert their own posted content" ON posted_content;
DROP POLICY IF EXISTS "Users can update their own posted content" ON posted_content;
DROP POLICY IF EXISTS "Users can delete their own posted content" ON posted_content;

CREATE POLICY "Users can view their own posted content"
  ON posted_content FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own posted content"
  ON posted_content FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own posted content"
  ON posted_content FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own posted content"
  ON posted_content FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);