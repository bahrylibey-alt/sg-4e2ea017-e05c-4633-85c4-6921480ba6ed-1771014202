-- Enable RLS on new tables
ALTER TABLE trend_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies for trend_products (shared data - all users can read)
CREATE POLICY "trend_products_read" ON trend_products FOR SELECT USING (true);
CREATE POLICY "trend_products_insert" ON trend_products FOR INSERT WITH CHECK (true);
CREATE POLICY "trend_products_update" ON trend_products FOR UPDATE USING (true);

-- RLS policies for traffic_events (user owns their data)
CREATE POLICY "traffic_events_own" ON traffic_events FOR ALL USING (auth.uid() = user_id);

-- RLS policies for ab_tests (user owns their tests)
CREATE POLICY "ab_tests_own" ON ab_tests FOR ALL USING (auth.uid() = user_id);