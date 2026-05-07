-- Add public SELECT policies for stats tables
-- Using CREATE OR REPLACE to handle existing policies

-- affiliate_links - allow counting
DROP POLICY IF EXISTS "public_count_affiliate_links" ON affiliate_links;
CREATE POLICY "public_count_affiliate_links" 
ON affiliate_links FOR SELECT 
USING (true);

-- generated_content - allow counting published content
DROP POLICY IF EXISTS "public_count_generated_content" ON generated_content;
CREATE POLICY "public_count_generated_content" 
ON generated_content FOR SELECT 
USING (true);

-- posted_content - allow counting posted content
DROP POLICY IF EXISTS "public_count_posted_content" ON posted_content;
CREATE POLICY "public_count_posted_content" 
ON posted_content FOR SELECT 
USING (true);

-- click_events - allow counting clicks
DROP POLICY IF EXISTS "public_count_click_events" ON click_events;
CREATE POLICY "public_count_click_events" 
ON click_events FOR SELECT 
USING (true);

-- view_events - allow counting views
DROP POLICY IF EXISTS "public_count_view_events" ON view_events;
CREATE POLICY "public_count_view_events" 
ON view_events FOR SELECT 
USING (true);

-- conversion_events - allow reading revenue for stats
DROP POLICY IF EXISTS "public_read_conversion_events" ON conversion_events;
CREATE POLICY "public_read_conversion_events" 
ON conversion_events FOR SELECT 
USING (true);