-- Create campaign_channels table
CREATE TABLE IF NOT EXISTS campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL CHECK (channel_id IN ('blog', 'email', 'social', 'youtube', 'paid', 'influencer')),
  channel_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view campaign channels" ON campaign_channels FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_channels.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create campaign channels" ON campaign_channels FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_channels.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);