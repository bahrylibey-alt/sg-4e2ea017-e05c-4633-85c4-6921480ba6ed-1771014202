-- ========================================
-- PERFORMANCE OPTIMIZATION: Add Indexes
-- ========================================
-- Speed up slug lookups (most critical path)
CREATE INDEX IF NOT EXISTS idx_affiliate_links_slug 
    ON affiliate_links(slug) 
    WHERE status = 'active';

-- Speed up user queries
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_status 
    ON affiliate_links(user_id, status);

-- Speed up analytics queries
CREATE INDEX IF NOT EXISTS idx_click_events_link_id 
    ON click_events(link_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_click_events_user_id 
    ON click_events(user_id, clicked_at DESC);

-- Speed up conversion tracking
CREATE INDEX IF NOT EXISTS idx_click_events_converted 
    ON click_events(link_id, converted) 
    WHERE converted = true;

-- ========================================
-- LINK HEALTH MONITORING
-- ========================================
-- Add health check fields to track link quality
ALTER TABLE affiliate_links 
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_working BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS check_failures INTEGER DEFAULT 0;

COMMENT ON COLUMN affiliate_links.last_checked_at IS 'Last time destination URL was verified';
COMMENT ON COLUMN affiliate_links.is_working IS 'Whether the destination URL is currently accessible';
COMMENT ON COLUMN affiliate_links.check_failures IS 'Number of consecutive health check failures';

-- ========================================
-- BOT DETECTION & FRAUD PREVENTION
-- ========================================
-- Add bot detection flags to click events
ALTER TABLE click_events 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fraud_score NUMERIC(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_click_events_fraud 
    ON click_events(link_id, is_bot, fraud_score);

COMMENT ON COLUMN click_events.is_bot IS 'Detected as bot/crawler traffic';
COMMENT ON COLUMN click_events.fraud_score IS 'Fraud probability score (0.0 - 1.0)';
COMMENT ON COLUMN click_events.ip_address IS 'Visitor IP address for fraud detection';

-- ========================================
-- A/B TESTING INFRASTRUCTURE
-- ========================================
-- Create table for A/B test variants
CREATE TABLE IF NOT EXISTS link_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_variants_parent 
    ON link_variants(parent_link_id, is_active);

COMMENT ON TABLE link_variants IS 'A/B test variants for affiliate links to optimize conversions';

-- ========================================
-- GEOGRAPHIC ROUTING
-- ========================================
-- Add geographic routing rules
CREATE TABLE IF NOT EXISTS geo_routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_routing_link 
    ON geo_routing_rules(link_id, country_code, is_active);

COMMENT ON TABLE geo_routing_rules IS 'Route users to region-specific product pages based on location';

-- ========================================
-- LINK ANALYTICS MATERIALIZED VIEW
-- ========================================
-- Create a fast analytics view for dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS link_performance_summary AS
SELECT 
    al.id as link_id,
    al.user_id,
    al.product_name,
    al.slug,
    al.status,
    al.click_count,
    al.conversion_count,
    al.commission_earned,
    CASE 
        WHEN al.click_count > 0 THEN (al.conversion_count::NUMERIC / al.click_count::NUMERIC * 100)
        ELSE 0 
    END as conversion_rate,
    COUNT(DISTINCT ce.id) as total_events,
    COUNT(DISTINCT ce.id) FILTER (WHERE ce.converted = true) as total_conversions,
    COUNT(DISTINCT DATE(ce.clicked_at)) as days_active,
    MAX(ce.clicked_at) as last_click_at
FROM affiliate_links al
LEFT JOIN click_events ce ON ce.link_id = al.id
GROUP BY al.id, al.user_id, al.product_name, al.slug, al.status, 
         al.click_count, al.conversion_count, al.commission_earned;

CREATE UNIQUE INDEX IF NOT EXISTS idx_link_performance_summary_link_id 
    ON link_performance_summary(link_id);

COMMENT ON MATERIALIZED VIEW link_performance_summary IS 'Pre-computed link performance metrics for fast dashboard loading';

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_link_performance_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY link_performance_summary;
END;
$$ LANGUAGE plpgsql;