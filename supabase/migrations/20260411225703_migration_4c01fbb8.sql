-- Create notification tables for view thresholds and conversions

CREATE TABLE IF NOT EXISTS view_threshold_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posted_content(id) ON DELETE CASCADE,
  threshold INTEGER NOT NULL,
  views_at_notification INTEGER NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, threshold)
);

CREATE TABLE IF NOT EXISTS conversion_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL,
  revenue DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversion_id)
);

CREATE TABLE IF NOT EXISTS traffic_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posted_content(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_view_threshold_notifications_user 
  ON view_threshold_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversion_notifications_user 
  ON conversion_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_traffic_warnings_user 
  ON traffic_warnings(user_id, resolved, created_at DESC);

-- RLS Policies
ALTER TABLE view_threshold_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own threshold notifications" ON view_threshold_notifications;
CREATE POLICY "Users manage own threshold notifications" 
  ON view_threshold_notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own conversion notifications" ON conversion_notifications;
CREATE POLICY "Users manage own conversion notifications" 
  ON conversion_notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own traffic warnings" ON traffic_warnings;
CREATE POLICY "Users manage own traffic warnings" 
  ON traffic_warnings FOR ALL USING (auth.uid() = user_id);