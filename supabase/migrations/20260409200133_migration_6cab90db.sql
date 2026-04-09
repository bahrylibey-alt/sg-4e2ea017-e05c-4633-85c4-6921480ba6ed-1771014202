-- Fix affiliate_links RLS policies
DROP POLICY IF EXISTS "Users can view their own affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can insert their own affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can update their own affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can delete their own affiliate links" ON affiliate_links;

CREATE POLICY "Users can view their own affiliate links"
  ON affiliate_links FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own affiliate links"
  ON affiliate_links FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own affiliate links"
  ON affiliate_links FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own affiliate links"
  ON affiliate_links FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);