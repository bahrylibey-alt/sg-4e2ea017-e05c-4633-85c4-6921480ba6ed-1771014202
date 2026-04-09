-- Create proper RLS policies for generated_content if missing
DROP POLICY IF EXISTS "Users can view their own generated content" ON generated_content;
DROP POLICY IF EXISTS "Users can insert their own generated content" ON generated_content;
DROP POLICY IF EXISTS "Users can update their own generated content" ON generated_content;
DROP POLICY IF EXISTS "Users can delete their own generated content" ON generated_content;

CREATE POLICY "Users can view their own generated content"
  ON generated_content FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own generated content"
  ON generated_content FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own generated content"
  ON generated_content FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own generated content"
  ON generated_content FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);