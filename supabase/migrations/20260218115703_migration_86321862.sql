-- Create campaign_products table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can view products for campaigns they own
CREATE POLICY "Users can view campaign products" ON campaign_products FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_products.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create campaign products" ON campaign_products FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_products.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);