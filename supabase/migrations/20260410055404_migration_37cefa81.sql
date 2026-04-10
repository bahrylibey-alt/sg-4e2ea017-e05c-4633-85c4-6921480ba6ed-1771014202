-- Fix commissions RLS - add public read
DROP POLICY IF EXISTS "Users can view their own commissions" ON commissions;
DROP POLICY IF EXISTS "public_read_commissions" ON commissions;

CREATE POLICY "public_read_commissions"
  ON commissions FOR SELECT
  USING (true);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;