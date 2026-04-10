-- Fix click_events RLS - add public read policy
DROP POLICY IF EXISTS "public_read_clicks" ON click_events;
DROP POLICY IF EXISTS "Users can view own click events" ON click_events;
DROP POLICY IF EXISTS "Users can view their link clicks" ON click_events;

CREATE POLICY "public_read_click_events"
  ON click_events FOR SELECT
  USING (true);

ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;