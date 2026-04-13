-- Create automatic sync triggers for tracking metrics
-- This ensures tracking events automatically update parent records

-- 1. Sync view events to posted_content
CREATE OR REPLACE FUNCTION sync_views_to_posted_content()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posted_content
  SET 
    impressions = impressions + NEW.views,
    updated_at = NOW()
  WHERE id = NEW.content_id AND NEW.content_id IS NOT NULL;
  
  UPDATE system_state
  SET 
    total_views = total_views + NEW.views,
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND NEW.user_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_view_event_sync ON view_events;
CREATE TRIGGER on_view_event_sync
AFTER INSERT ON view_events
FOR EACH ROW EXECUTE FUNCTION sync_views_to_posted_content();

-- 2. Sync click events to posted_content and affiliate_links
CREATE OR REPLACE FUNCTION sync_clicks_to_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Update posted content
  UPDATE posted_content
  SET 
    clicks = clicks + 1,
    updated_at = NOW()
  WHERE id = NEW.content_id AND NEW.content_id IS NOT NULL;
  
  -- Update affiliate link
  UPDATE affiliate_links
  SET 
    clicks = clicks + 1,
    click_count = click_count + 1,
    updated_at = NOW()
  WHERE id = NEW.link_id AND NEW.link_id IS NOT NULL;
  
  -- Update system state
  UPDATE system_state
  SET 
    total_clicks = total_clicks + 1,
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND NEW.user_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_click_event_sync ON click_events;
CREATE TRIGGER on_click_event_sync
AFTER INSERT ON click_events
FOR EACH ROW EXECUTE FUNCTION sync_clicks_to_content();

-- 3. Sync conversion events to all relevant tables
CREATE OR REPLACE FUNCTION sync_conversions_to_all()
RETURNS TRIGGER AS $$
DECLARE
  v_click_record RECORD;
BEGIN
  -- Get the click record to find content_id and link_id
  SELECT * INTO v_click_record
  FROM click_events
  WHERE click_id = NEW.click_id
  LIMIT 1;
  
  IF v_click_record.content_id IS NOT NULL THEN
    -- Update posted content
    UPDATE posted_content
    SET 
      conversions = conversions + 1,
      revenue = revenue + NEW.revenue,
      updated_at = NOW()
    WHERE id = v_click_record.content_id;
  END IF;
  
  IF v_click_record.link_id IS NOT NULL THEN
    -- Update affiliate link
    UPDATE affiliate_links
    SET 
      conversions = conversions + 1,
      conversion_count = conversion_count + 1,
      revenue = revenue + NEW.revenue,
      updated_at = NOW()
    WHERE id = v_click_record.link_id;
  END IF;
  
  -- Update system state (only verified conversions)
  IF NEW.verified = true THEN
    UPDATE system_state
    SET 
      total_verified_conversions = total_verified_conversions + 1,
      total_verified_revenue = total_verified_revenue + NEW.revenue,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND NEW.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_conversion_event_sync ON conversion_events;
CREATE TRIGGER on_conversion_event_sync
AFTER INSERT ON conversion_events
FOR EACH ROW EXECUTE FUNCTION sync_conversions_to_all();