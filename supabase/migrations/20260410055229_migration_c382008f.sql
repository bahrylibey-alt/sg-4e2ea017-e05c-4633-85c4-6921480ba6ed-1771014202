-- Fix commissions RLS if needed
DROP POLICY IF EXISTS "Users can view their commissions" ON commissions;
DROP POLICY IF EXISTS "Public can view commissions" ON commissions;

CREATE POLICY "public_read_commissions"
  ON commissions FOR SELECT
  USING (true);

CREATE POLICY "authenticated_insert_commissions"
  ON commissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;