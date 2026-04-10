-- Fix click_events RLS policies - allow public read, user write
DROP POLICY IF EXISTS "Users can view click events" ON click_events;
DROP POLICY IF EXISTS "Users can insert click events" ON click_events;
DROP POLICY IF EXISTS "Public can view click events" ON click_events;

CREATE POLICY "public_read_clicks"
  ON click_events FOR SELECT
  USING (true);

CREATE POLICY "anyone_can_track_clicks"
  ON click_events FOR INSERT
  WITH CHECK (true);

-- Enable RLS
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;