-- Create social media connections table
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'youtube', 'twitter', 'pinterest', 'linkedin')),
  account_name TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  last_posted_at TIMESTAMP WITH TIME ZONE,
  total_posts INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC(5,2) DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);

-- RLS policies
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social accounts" ON social_media_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Create posting schedule table
CREATE TABLE IF NOT EXISTS public.posting_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_frequency TEXT DEFAULT 'daily' CHECK (post_frequency IN ('hourly', 'daily', 'twice_daily', 'weekly', 'custom')),
  posts_per_day INTEGER DEFAULT 2,
  posting_times TIME[] DEFAULT ARRAY['10:00:00', '18:00:00']::TIME[],
  auto_generate_content BOOLEAN DEFAULT true,
  auto_select_products BOOLEAN DEFAULT true,
  use_ai_captions BOOLEAN DEFAULT true,
  use_trending_hashtags BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE posting_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedules" ON posting_schedule
  FOR ALL USING (auth.uid() = user_id);

-- Create posted content tracking table
CREATE TABLE IF NOT EXISTS public.posted_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product_catalog(id) ON DELETE SET NULL,
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('image', 'video', 'carousel', 'story', 'reel', 'short')),
  caption TEXT,
  hashtags TEXT[],
  media_urls TEXT[],
  platform_post_id TEXT,
  post_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'deleted')),
  engagement_data JSONB DEFAULT '{}'::jsonb,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE posted_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts" ON posted_content
  FOR ALL USING (auth.uid() = user_id);

-- Create AI tools configuration table
CREATE TABLE IF NOT EXISTS public.ai_tools_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tool_name)
);

ALTER TABLE ai_tools_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI tools" ON ai_tools_config
  FOR ALL USING (auth.uid() = user_id);