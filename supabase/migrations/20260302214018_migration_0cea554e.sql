-- Create robust RPC function for atomic click incrementing
CREATE OR REPLACE FUNCTION increment_link_clicks(link_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_links
  SET 
    clicks = COALESCE(clicks, 0) + 1,
    click_count = COALESCE(click_count, 0) + 1,
    updated_at = NOW()
  WHERE id = link_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create robust RPC function for health monitoring updates
CREATE OR REPLACE FUNCTION update_link_health_status(link_uuid UUID, is_healthy BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_links
  SET 
    last_checked_at = NOW(),
    is_working = is_healthy,
    check_failures = CASE WHEN is_healthy THEN 0 ELSE COALESCE(check_failures, 0) + 1 END
  WHERE id = link_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to allow public execution (for tracking clicks from external users)
GRANT EXECUTE ON FUNCTION increment_link_clicks(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_link_health_status(UUID, BOOLEAN) TO anon, authenticated, service_role;

-- Ensure the public policy is definitely applied (re-run to be safe)
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active affiliate links" ON affiliate_links;
CREATE POLICY "Public can view active affiliate links" ON affiliate_links FOR SELECT USING (status = 'active');