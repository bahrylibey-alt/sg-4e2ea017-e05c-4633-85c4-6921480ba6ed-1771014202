-- Add new columns to existing click_events table
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'unknown';
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS click_id TEXT;

-- Create view tracking events (aggregated)
CREATE TABLE IF NOT EXISTS view_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID,
  platform TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tracked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversion events (ONLY from verified webhooks)
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  click_id TEXT,
  content_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  webhook_data JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system state tracking
CREATE TABLE IF NOT EXISTS system_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'NO_TRAFFIC',
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_verified_conversions INTEGER DEFAULT 0,
  total_verified_revenue DECIMAL(10,2) DEFAULT 0,
  posts_today INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  last_traffic_check TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content performance tracking
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hook_score INTEGER DEFAULT 0,
  curiosity_score INTEGER DEFAULT 0,
  clarity_score INTEGER DEFAULT 0,
  emotion_score INTEGER DEFAULT 0,
  platform_optimized BOOLEAN DEFAULT false,
  humanization_applied BOOLEAN DEFAULT false,
  views_24h INTEGER DEFAULT 0,
  status TEXT DEFAULT 'TESTING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Autopilot safety log
CREATE TABLE IF NOT EXISTS autopilot_safety_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_click_events_content ON click_events(content_id);
CREATE INDEX IF NOT EXISTS idx_click_events_platform ON click_events(platform);
CREATE INDEX IF NOT EXISTS idx_click_events_click_id ON click_events(click_id);
CREATE INDEX IF NOT EXISTS idx_view_events_content ON view_events(content_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_click ON conversion_events(click_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_verified ON conversion_events(verified);
CREATE INDEX IF NOT EXISTS idx_content_performance_status ON content_performance(status);
CREATE INDEX IF NOT EXISTS idx_system_state_state ON system_state(state);

-- Enable RLS
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_safety_log ENABLE ROW LEVEL SECURITY;

-- Apply Policies safely
DO $$ 
BEGIN
  BEGIN CREATE POLICY "click_select" ON click_events FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  BEGIN CREATE POLICY "click_insert" ON click_events FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN CREATE POLICY "view_select" ON view_events FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  BEGIN CREATE POLICY "view_insert" ON view_events FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN CREATE POLICY "conv_select" ON conversion_events FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  BEGIN CREATE POLICY "conv_insert" ON conversion_events FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN CREATE POLICY "state_select" ON system_state FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  BEGIN CREATE POLICY "state_all" ON system_state FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN CREATE POLICY "perf_select" ON content_performance FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  BEGIN CREATE POLICY "perf_all" ON content_performance FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN CREATE POLICY "safety_select" ON autopilot_safety_log FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN END;
  BEGIN CREATE POLICY "safety_insert" ON autopilot_safety_log FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN END;
END $$;