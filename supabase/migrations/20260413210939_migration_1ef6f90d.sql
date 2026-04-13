-- Step 3: Create triggers to auto-update system_state from posted_content
CREATE OR REPLACE FUNCTION update_system_state_from_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Update system_state when posted_content metrics change
  UPDATE system_state
  SET 
    total_clicks = (
      SELECT COALESCE(SUM(clicks), 0)
      FROM posted_content
      WHERE user_id = NEW.user_id
      AND posted_at IS NOT NULL
    ),
    total_verified_conversions = (
      SELECT COALESCE(SUM(conversions), 0)
      FROM posted_content
      WHERE user_id = NEW.user_id
      AND posted_at IS NOT NULL
    ),
    total_verified_revenue = (
      SELECT COALESCE(SUM(revenue), 0)
      FROM posted_content
      WHERE user_id = NEW.user_id
      AND posted_at IS NOT NULL
    ),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_system_state_from_post ON posted_content;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER sync_system_state_from_post
  AFTER INSERT OR UPDATE OF clicks, conversions, revenue ON posted_content
  FOR EACH ROW
  WHEN (NEW.posted_at IS NOT NULL)
  EXECUTE FUNCTION update_system_state_from_post();