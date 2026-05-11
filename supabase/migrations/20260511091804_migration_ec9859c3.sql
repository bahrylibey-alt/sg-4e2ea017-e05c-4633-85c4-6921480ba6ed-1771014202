-- Fix RLS policies for campaigns table
-- Allow authenticated users to manage their own campaigns

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;

-- Create new permissive policies
CREATE POLICY "auth_insert_campaigns" ON campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_select_campaigns" ON campaigns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "auth_update_campaigns" ON campaigns
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "auth_delete_campaigns" ON campaigns
  FOR DELETE
  USING (auth.uid() = user_id);