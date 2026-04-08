-- Add unique constraint on campaign_id + source_name to prevent duplicates
-- This allows upsert operations to work properly
ALTER TABLE traffic_sources 
ADD CONSTRAINT traffic_sources_campaign_source_unique 
UNIQUE (campaign_id, source_name);

-- Add helpful index for performance
CREATE INDEX IF NOT EXISTS idx_traffic_sources_campaign_source 
ON traffic_sources(campaign_id, source_name);