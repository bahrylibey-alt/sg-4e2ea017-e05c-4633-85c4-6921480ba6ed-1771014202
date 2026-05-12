-- Bridge Pages Table
CREATE TABLE IF NOT EXISTS bridge_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product_catalog(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  headline TEXT NOT NULL,
  story_content TEXT,
  benefits TEXT[],
  social_proof TEXT[],
  cta_text TEXT,
  urgency_message TEXT,
  trust_badges TEXT[],
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bridge_pages_user ON bridge_pages(user_id);
CREATE INDEX idx_bridge_pages_slug ON bridge_pages(slug);
CREATE INDEX idx_bridge_pages_status ON bridge_pages(status);

-- RLS Policies for bridge_pages
ALTER TABLE bridge_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bridge pages" ON bridge_pages FOR SELECT USING (status = 'active');
CREATE POLICY "Users manage own bridge pages" ON bridge_pages FOR ALL USING (user_id = auth.uid());

-- Lead Magnets Table
CREATE TABLE IF NOT EXISTS lead_magnets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product_catalog(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf_guide', 'video_course', 'checklist', 'template', 'ebook')),
  file_url TEXT,
  downloads INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_magnets_user ON lead_magnets(user_id);
CREATE INDEX idx_lead_magnets_product ON lead_magnets(product_id);

ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lead magnets" ON lead_magnets FOR ALL USING (user_id = auth.uid());

-- Tracking Pixels Table
CREATE TABLE IF NOT EXISTS tracking_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  pixel_type TEXT NOT NULL CHECK (pixel_type IN ('facebook', 'google_ads', 'tiktok', 'snapchat', 'twitter')),
  pixel_id TEXT NOT NULL,
  events TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_pixels_user ON tracking_pixels(user_id);
CREATE INDEX idx_tracking_pixels_type ON tracking_pixels(pixel_type);

ALTER TABLE tracking_pixels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tracking pixels" ON tracking_pixels FOR ALL USING (user_id = auth.uid());

-- Viral Mechanics Table
CREATE TABLE IF NOT EXISTS viral_mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mechanic_type TEXT NOT NULL CHECK (mechanic_type IN ('referral', 'social_share', 'content_multiplier', 'gamification')),
  config JSONB DEFAULT '{}',
  shares_count INTEGER DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  viral_coefficient NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_viral_mechanics_user ON viral_mechanics(user_id);
CREATE INDEX idx_viral_mechanics_type ON viral_mechanics(mechanic_type);

ALTER TABLE viral_mechanics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own viral mechanics" ON viral_mechanics FOR ALL USING (user_id = auth.uid());

-- Auto Optimization Table
CREATE TABLE IF NOT EXISTS auto_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('ab_testing', 'traffic_routing', 'content_refresh', 'price_optimization')),
  config JSONB DEFAULT '{}',
  tests_run INTEGER DEFAULT 0,
  improvements_made INTEGER DEFAULT 0,
  performance_lift NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'stopped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_optimization_user ON auto_optimization(user_id);
CREATE INDEX idx_auto_optimization_type ON auto_optimization(optimization_type);

ALTER TABLE auto_optimization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own auto optimization" ON auto_optimization FOR ALL USING (user_id = auth.uid());

-- Lead Captures Table
CREATE TABLE IF NOT EXISTS lead_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_magnet_id UUID REFERENCES lead_magnets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product_catalog(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_captures_user ON lead_captures(user_id);
CREATE INDEX idx_lead_captures_email ON lead_captures(email);
CREATE INDEX idx_lead_captures_magnet ON lead_captures(lead_magnet_id);

ALTER TABLE lead_captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lead captures" ON lead_captures FOR ALL USING (user_id = auth.uid());