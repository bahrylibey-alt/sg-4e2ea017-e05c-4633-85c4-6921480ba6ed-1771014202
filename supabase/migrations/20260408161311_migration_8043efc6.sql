-- Create tables for revolutionary features - REAL data only
CREATE TABLE IF NOT EXISTS trend_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  asin TEXT,
  category TEXT,
  current_price DECIMAL(10,2),
  trend_score INTEGER, -- 0-100, calculated from multiple sources
  velocity INTEGER, -- Sales velocity (units per day)
  search_volume INTEGER, -- Google search volume
  competition_score INTEGER, -- 0-100, lower is better
  profit_margin DECIMAL(5,2),
  trending_platforms TEXT[], -- ['tiktok', 'amazon', 'google_trends']
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_trend_products_score ON trend_products(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_products_status ON trend_products(status);

-- Table for real-time traffic analytics
CREATE TABLE IF NOT EXISTS traffic_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  visitor_id TEXT,
  event_type TEXT, -- 'pageview', 'click', 'conversion'
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  country TEXT,
  product_id UUID,
  revenue DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_events_user ON traffic_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_events_type ON traffic_events(event_type);

-- Table for AI optimization experiments
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  campaign_id UUID REFERENCES campaigns(id),
  test_name TEXT NOT NULL,
  variant_a JSONB, -- Original version
  variant_b JSONB, -- Test version
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  variant_a_visitors INTEGER DEFAULT 0,
  variant_b_visitors INTEGER DEFAULT 0,
  winning_variant TEXT, -- 'a', 'b', or null if test running
  confidence_level DECIMAL(5,2), -- Statistical confidence
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running'
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_user ON ab_tests(user_id, status);