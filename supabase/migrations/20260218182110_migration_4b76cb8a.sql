-- A/B Tests Table (Real split testing data)
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
  winner_variant_id UUID,
  confidence_level DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- A/B Test Variants
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  content TEXT,
  visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ab_tests
CREATE POLICY "Users can view their ab tests" ON ab_tests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their ab tests" ON ab_tests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their ab tests" ON ab_tests
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their ab tests" ON ab_tests
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for ab_test_variants
CREATE POLICY "Users can view their test variants" ON ab_test_variants
  FOR SELECT USING (
    test_id IN (SELECT id FROM ab_tests WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert test variants" ON ab_test_variants
  FOR INSERT WITH CHECK (
    test_id IN (SELECT id FROM ab_tests WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update test variants" ON ab_test_variants
  FOR UPDATE USING (
    test_id IN (SELECT id FROM ab_tests WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete test variants" ON ab_test_variants
  FOR DELETE USING (
    test_id IN (SELECT id FROM ab_tests WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_ab_tests_campaign ON ab_tests(campaign_id);
CREATE INDEX idx_ab_tests_user ON ab_tests(user_id);
CREATE INDEX idx_ab_test_variants_test ON ab_test_variants(test_id);