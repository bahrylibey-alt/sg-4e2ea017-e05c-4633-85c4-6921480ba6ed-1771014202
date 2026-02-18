-- Fix traffic_sources table
ALTER TABLE traffic_sources ADD COLUMN IF NOT EXISTS cpc DECIMAL(10,2) DEFAULT 0;
ALTER TABLE traffic_sources ADD COLUMN IF NOT EXISTS ctr DECIMAL(5,2) DEFAULT 0;
ALTER TABLE traffic_sources ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0;

-- Fix ab_tests table
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS test_type TEXT;
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS target_sample_size INTEGER DEFAULT 1000;

-- Fix ab_test_variants table
ALTER TABLE ab_test_variants ADD COLUMN IF NOT EXISTS is_control BOOLEAN DEFAULT false;
-- Rename visitors to impressions to match service terminology if preferred, or just use visitors
-- keeping visitors but will update service code to use visitors