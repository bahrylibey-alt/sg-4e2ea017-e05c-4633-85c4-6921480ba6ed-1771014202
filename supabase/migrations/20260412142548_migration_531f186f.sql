-- Unlock RLS so anonymous external visitors can successfully increment click counters
    
    -- 1. Allow updating affiliate_links clicks
    DROP POLICY IF EXISTS "anon_update_affiliate_links" ON affiliate_links;
    CREATE POLICY "anon_update_affiliate_links" ON affiliate_links 
    FOR UPDATE USING (true);

    -- 2. Allow updating posted_content clicks
    DROP POLICY IF EXISTS "anon_update_posted_content" ON posted_content;
    CREATE POLICY "anon_update_posted_content" ON posted_content 
    FOR UPDATE USING (true);

    -- 3. Allow inserting click_events
    ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "anon_insert_click_events" ON click_events;
    CREATE POLICY "anon_insert_click_events" ON click_events 
    FOR INSERT WITH CHECK (true);

    -- 4. Allow inserting activity_logs for clicks
    DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
    CREATE POLICY "anon_insert_activity_logs" ON activity_logs 
    FOR INSERT WITH CHECK (true);