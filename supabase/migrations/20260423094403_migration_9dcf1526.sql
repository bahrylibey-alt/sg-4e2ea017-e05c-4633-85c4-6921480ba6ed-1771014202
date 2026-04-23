-- Create policy: authenticated users can read their own content (any status)
CREATE POLICY "users_read_own_content"
ON generated_content
FOR SELECT
USING (auth.uid() = user_id);