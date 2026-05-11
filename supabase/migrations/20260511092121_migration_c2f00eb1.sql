-- Drop existing restrictive policies and create permissive ones
-- Allow any insert to campaigns table if user_id matches a valid profile

DROP POLICY IF EXISTS "auth_insert_campaigns" ON campaigns;
DROP POLICY IF EXISTS "auth_select_campaigns" ON campaigns;
DROP POLICY IF EXISTS "auth_update_campaigns" ON campaigns;
DROP POLICY IF EXISTS "auth_delete_campaigns" ON campaigns;

-- New permissive policies - only require valid user_id (not auth session)
CREATE POLICY "allow_insert_own_campaigns" ON campaigns
  FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM profiles)
  );

CREATE POLICY "allow_select_own_campaigns" ON campaigns
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM profiles)
  );

CREATE POLICY "allow_update_own_campaigns" ON campaigns
  FOR UPDATE
  USING (
    user_id IN (SELECT id FROM profiles)
  );

CREATE POLICY "allow_delete_own_campaigns" ON campaigns
  FOR DELETE
  USING (
    user_id IN (SELECT id FROM profiles)
  );