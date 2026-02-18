-- Retargeting Audiences Table (Real audience segmentation)
CREATE TABLE IF NOT EXISTS retargeting_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('cart_abandoners', 'page_visitors', 'engaged_users', 'converters', 'non_converters')),
  size INTEGER DEFAULT 0,
  recency_days INTEGER DEFAULT 30,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Retargeting Campaigns Table
CREATE TABLE IF NOT EXISTS retargeting_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  audience_id UUID NOT NULL REFERENCES retargeting_audiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ad_content TEXT,
  budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  frequency_cap INTEGER DEFAULT 3,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE retargeting_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE retargeting_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retargeting_audiences
CREATE POLICY "Users can view their retargeting audiences" ON retargeting_audiences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert retargeting audiences" ON retargeting_audiences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their retargeting audiences" ON retargeting_audiences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their retargeting audiences" ON retargeting_audiences
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for retargeting_campaigns
CREATE POLICY "Users can view their retargeting campaigns" ON retargeting_campaigns
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert retargeting campaigns" ON retargeting_campaigns
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their retargeting campaigns" ON retargeting_campaigns
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their retargeting campaigns" ON retargeting_campaigns
  FOR DELETE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_retargeting_audiences_campaign ON retargeting_audiences(campaign_id);
CREATE INDEX idx_retargeting_audiences_user ON retargeting_audiences(user_id);
CREATE INDEX idx_retargeting_campaigns_campaign ON retargeting_campaigns(campaign_id);
CREATE INDEX idx_retargeting_campaigns_audience ON retargeting_campaigns(audience_id);