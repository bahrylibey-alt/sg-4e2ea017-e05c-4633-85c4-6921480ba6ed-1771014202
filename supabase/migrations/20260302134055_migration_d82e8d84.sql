-- Add automation_enabled column to traffic_sources table
ALTER TABLE traffic_sources 
ADD COLUMN automation_enabled boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN traffic_sources.automation_enabled IS 'Whether automated traffic routing is enabled for this source';