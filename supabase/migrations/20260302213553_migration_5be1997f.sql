-- CRITICAL: Allow public access to affiliate links for redirection
-- Without this, external visitors get "Link not found" because they can't query the table
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'affiliate_links' 
        AND policyname = 'Public can view active affiliate links'
    ) THEN
        CREATE POLICY "Public can view active affiliate links" 
        ON affiliate_links 
        FOR SELECT 
        USING (status = 'active');
    END IF;
END $$;

-- Ensure click_events can be inserted by public (anonymous users tracking clicks)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'click_events' 
        AND policyname = 'Public can insert click events'
    ) THEN
        CREATE POLICY "Public can insert click events" 
        ON click_events 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;