-- Create settings table for autopilot customization
CREATE TABLE IF NOT EXISTS autopilot_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Frequency Settings
  autopilot_frequency VARCHAR(50) DEFAULT 'every_30_minutes' CHECK (autopilot_frequency IN ('every_15_minutes', 'every_30_minutes', 'hourly', 'every_6_hours', 'daily')),
  content_generation_frequency VARCHAR(50) DEFAULT 'daily' CHECK (content_generation_frequency IN ('hourly', 'every_6_hours', 'daily', 'weekly')),
  product_discovery_frequency VARCHAR(50) DEFAULT 'daily' CHECK (product_discovery_frequency IN ('daily', 'weekly', 'monthly')),
  
  -- Target Niches (JSONB for flexibility)
  target_niches JSONB DEFAULT '[]'::jsonb,
  excluded_niches JSONB DEFAULT '[]'::jsonb,
  
  -- Content Preferences
  content_tone VARCHAR(50) DEFAULT 'conversational' CHECK (content_tone IN ('professional', 'conversational', 'casual', 'enthusiastic', 'educational')),
  content_length VARCHAR(50) DEFAULT 'medium' CHECK (content_length IN ('short', 'medium', 'long')),
  use_emojis BOOLEAN DEFAULT true,
  use_hashtags BOOLEAN DEFAULT true,
  max_hashtags INT DEFAULT 5 CHECK (max_hashtags >= 0 AND max_hashtags <= 30),
  
  -- Platform Preferences (which platforms to post to)
  enabled_platforms JSONB DEFAULT '["pinterest", "tiktok", "twitter", "facebook", "instagram"]'::jsonb,
  
  -- Product Discovery Preferences
  min_product_price DECIMAL(10,2) DEFAULT 10.00,
  max_product_price DECIMAL(10,2) DEFAULT 500.00,
  min_product_rating DECIMAL(3,2) DEFAULT 4.0,
  preferred_networks JSONB DEFAULT '["amazon", "aliexpress"]'::jsonb,
  
  -- Advanced Settings
  auto_scale_winners BOOLEAN DEFAULT true,
  scale_threshold INT DEFAULT 100 CHECK (scale_threshold > 0),
  pause_underperformers BOOLEAN DEFAULT true,
  pause_threshold INT DEFAULT 20 CHECK (pause_threshold > 0),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE autopilot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON autopilot_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON autopilot_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON autopilot_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default settings for existing user
INSERT INTO autopilot_settings (user_id)
VALUES ('cd9e03a2-9620-44be-a934-ac2ed69db465')
ON CONFLICT (user_id) DO NOTHING;

SELECT 'Created autopilot_settings table' as status;