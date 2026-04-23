-- Create new policy: anyone can read PUBLISHED content
CREATE POLICY "public_read_published_content"
ON generated_content
FOR SELECT
USING (status = 'published');