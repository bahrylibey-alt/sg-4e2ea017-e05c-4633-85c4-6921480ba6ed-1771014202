-- Create comprehensive RLS policies for integrations table
-- Allow users to manage their own integrations securely

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own integrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON integrations;
CREATE POLICY "Users can view their own integrations" 
ON integrations FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own integrations
DROP POLICY IF EXISTS "Users can insert their own integrations" ON integrations;
CREATE POLICY "Users can insert their own integrations" 
ON integrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own integrations
DROP POLICY IF EXISTS "Users can update their own integrations" ON integrations;
CREATE POLICY "Users can update their own integrations" 
ON integrations FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own integrations
DROP POLICY IF EXISTS "Users can delete their own integrations" ON integrations;
CREATE POLICY "Users can delete their own integrations" 
ON integrations FOR DELETE 
USING (auth.uid() = user_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'integrations';