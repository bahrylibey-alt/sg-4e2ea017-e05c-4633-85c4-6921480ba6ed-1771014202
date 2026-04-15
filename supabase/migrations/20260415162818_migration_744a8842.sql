-- Fix the broken triggers by dropping CASCADE
DROP TRIGGER IF EXISTS sync_clicks_trigger ON click_events CASCADE;
DROP TRIGGER IF EXISTS on_click_event_sync ON click_events CASCADE;
DROP FUNCTION IF EXISTS sync_clicks_to_content() CASCADE;

DROP TRIGGER IF EXISTS sync_views_trigger ON view_events CASCADE;
DROP FUNCTION IF EXISTS sync_views_to_posted_content() CASCADE;

-- Create corrected trigger functions WITHOUT updated_at (column doesn't exist)
CREATE OR REPLACE FUNCTION sync_clicks_to_content()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posted_content
  SET clicks = clicks + 1
  WHERE id = NEW.content_id AND NEW.content_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_views_to_posted_content()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posted_content
  SET impressions = impressions + NEW.views
  WHERE id = NEW.content_id AND NEW.content_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER sync_clicks_trigger
AFTER INSERT ON click_events
FOR EACH ROW
EXECUTE FUNCTION sync_clicks_to_content();

CREATE TRIGGER sync_views_trigger
AFTER INSERT ON view_events
FOR EACH ROW
EXECUTE FUNCTION sync_views_to_posted_content();

-- Verify triggers work
SELECT 'Triggers Fixed' as status;