-- CRITICAL FIX: RLS Policies for affiliate_links table
-- This is why users can't see their own links!

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can view active affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can view own links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can insert own links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can update own links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can delete own links" ON affiliate_links;

-- Create comprehensive policies that work for both authenticated users AND public visitors
-- Policy 1: Authenticated users can view their own links (any status)
CREATE POLICY "Users can view own links" 
ON affiliate_links 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Public visitors can view ONLY active links (for redirection)
CREATE POLICY "Public can view active links for redirect" 
ON affiliate_links 
FOR SELECT 
USING (status = 'active' AND auth.uid() IS NULL);

-- Policy 3: Authenticated users can insert their own links
CREATE POLICY "Users can insert own links" 
ON affiliate_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Authenticated users can update their own links
CREATE POLICY "Users can update own links" 
ON affiliate_links 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy 5: Authenticated users can delete their own links
CREATE POLICY "Users can delete own links" 
ON affiliate_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix click_events RLS to allow public tracking
DROP POLICY IF EXISTS "Anyone can track clicks" ON click_events;
DROP POLICY IF EXISTS "Users can view own click events" ON click_events;

-- Allow public click tracking (for external visitors)
CREATE POLICY "Anyone can track clicks" 
ON click_events 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own click events
CREATE POLICY "Users can view own click events" 
ON click_events 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Verify policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('affiliate_links', 'click_events')
ORDER BY tablename, policyname;