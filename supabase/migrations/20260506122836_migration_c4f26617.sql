-- Drop the restrictive view_select policy that's blocking public counts
DROP POLICY IF EXISTS "view_select" ON view_events;

-- Verify the public policy is the only one remaining
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'view_events' AND cmd = 'SELECT';