-- Add campaign_id to affiliate_links table
ALTER TABLE affiliate_links 
ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_affiliate_links_campaign_id ON affiliate_links(campaign_id);

-- Update existing links to associate with most recent campaign for their user
UPDATE affiliate_links al
SET campaign_id = (
  SELECT c.id 
  FROM campaigns c 
  WHERE c.user_id = al.user_id 
  ORDER BY c.created_at DESC 
  LIMIT 1
)
WHERE al.campaign_id IS NULL;