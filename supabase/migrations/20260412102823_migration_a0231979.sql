-- CREATE AUTOMATIC AGGREGATION TRIGGERS
-- These will keep system_state in sync automatically

-- Function: Auto-update when posted_content impressions change
CREATE OR REPLACE FUNCTION sync_impressions_to_system_state()
RETURNS trigger AS $$
BEGIN
  -- Update system_state total_views from sum of all impressions
  UPDATE system_state
  SET 
    total_views = COALESCE((
      SELECT SUM(impressions)
      FROM posted_content
      WHERE user_id = NEW.user_id AND status = 'posted'
    ), 0),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- If no system_state exists, create it
  IF NOT FOUND THEN
    INSERT INTO system_state (user_id, state, total_views, total_clicks, total_verified_conversions, total_verified_revenue, posts_today)
    VALUES (NEW.user_id, 'TESTING', NEW.impressions, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After INSERT or UPDATE on posted_content
DROP TRIGGER IF EXISTS auto_sync_impressions ON posted_content;
CREATE TRIGGER auto_sync_impressions
AFTER INSERT OR UPDATE OF impressions ON posted_content
FOR EACH ROW
EXECUTE FUNCTION sync_impressions_to_system_state();

-- Function: Auto-update when posted_content clicks change
CREATE OR REPLACE FUNCTION sync_clicks_to_system_state()
RETURNS trigger AS $$
BEGIN
  -- Update system_state total_clicks from sum of all clicks
  UPDATE system_state
  SET 
    total_clicks = COALESCE((
      SELECT SUM(clicks)
      FROM posted_content
      WHERE user_id = NEW.user_id AND status = 'posted'
    ), 0),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After INSERT or UPDATE on posted_content (clicks)
DROP TRIGGER IF EXISTS auto_sync_clicks ON posted_content;
CREATE TRIGGER auto_sync_clicks
AFTER INSERT OR UPDATE OF clicks ON posted_content
FOR EACH ROW
EXECUTE FUNCTION sync_clicks_to_system_state();

-- Function: Auto-update when posted_content conversions change
CREATE OR REPLACE FUNCTION sync_conversions_to_system_state()
RETURNS trigger AS $$
BEGIN
  -- Update system_state from sum of all conversions and revenue
  UPDATE system_state
  SET 
    total_verified_conversions = COALESCE((
      SELECT SUM(conversions)
      FROM posted_content
      WHERE user_id = NEW.user_id AND status = 'posted'
    ), 0),
    total_verified_revenue = COALESCE((
      SELECT SUM(revenue)
      FROM posted_content
      WHERE user_id = NEW.user_id AND status = 'posted'
    ), 0),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After INSERT or UPDATE on posted_content (conversions/revenue)
DROP TRIGGER IF EXISTS auto_sync_conversions ON posted_content;
CREATE TRIGGER auto_sync_conversions
AFTER INSERT OR UPDATE OF conversions, revenue ON posted_content
FOR EACH ROW
EXECUTE FUNCTION sync_conversions_to_system_state();