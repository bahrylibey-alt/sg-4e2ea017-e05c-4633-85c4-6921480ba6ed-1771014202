-- Fix traffic_sources RLS - simplify to public read
DROP POLICY IF EXISTS "Users can view their campaign traffic sources" ON traffic_sources;
DROP POLICY IF EXISTS "public_read_traffic_sources" ON traffic_sources;

CREATE POLICY "public_read_traffic_sources"
  ON traffic_sources FOR SELECT
  USING (true);

ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;