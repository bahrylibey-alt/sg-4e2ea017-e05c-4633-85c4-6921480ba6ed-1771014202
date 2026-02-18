-- Analytics Data Tables (Real performance tracking)
CREATE TABLE IF NOT EXISTS campaign_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funnel Stages (Real conversion funnel tracking)
CREATE TABLE IF NOT EXISTS funnel_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  visitors INTEGER DEFAULT 0,
  drop_off INTEGER DEFAULT 0,
  avg_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing History (Real dynamic pricing tracking)
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  optimized_price DECIMAL(10,2) NOT NULL,
  price_elasticity DECIMAL(5,2),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revenue_impact DECIMAL(10,2) DEFAULT 0
);

-- Fraud Alerts (Real fraud detection)
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('click_fraud', 'conversion_fraud', 'bot_traffic', 'invalid_traffic')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address TEXT,
  details TEXT,
  estimated_loss DECIMAL(10,2) DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Sequences (Real email automation)
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('welcome', 'abandoned_cart', 'nurture', 'winback')),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  day_delay INTEGER NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  template_content TEXT,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Proof Events (Real social proof tracking)
CREATE TABLE IF NOT EXISTS social_proof_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('purchase', 'signup', 'view', 'cart_add')),
  product_name TEXT,
  country TEXT,
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can only access their own campaign data)
CREATE POLICY "Users can view their campaign performance" ON campaign_performance FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert their campaign performance" ON campaign_performance FOR INSERT WITH CHECK (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their funnel stages" ON funnel_stages FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their funnel stages" ON funnel_stages FOR ALL USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their pricing history" ON pricing_history FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert pricing history" ON pricing_history FOR INSERT WITH CHECK (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their fraud alerts" ON fraud_alerts FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage fraud alerts" ON fraud_alerts FOR ALL USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their email sequences" ON email_sequences FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage email sequences" ON email_sequences FOR ALL USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view email templates" ON email_templates FOR SELECT USING (
  sequence_id IN (SELECT id FROM email_sequences WHERE campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can manage email templates" ON email_templates FOR ALL USING (
  sequence_id IN (SELECT id FROM email_sequences WHERE campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can view their social proof events" ON social_proof_events FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert social proof events" ON social_proof_events FOR INSERT WITH CHECK (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_campaign_performance_campaign ON campaign_performance(campaign_id);
CREATE INDEX idx_campaign_performance_date ON campaign_performance(date);
CREATE INDEX idx_funnel_stages_campaign ON funnel_stages(campaign_id);
CREATE INDEX idx_pricing_history_campaign ON pricing_history(campaign_id);
CREATE INDEX idx_fraud_alerts_campaign ON fraud_alerts(campaign_id);
CREATE INDEX idx_fraud_alerts_resolved ON fraud_alerts(resolved);
CREATE INDEX idx_email_sequences_campaign ON email_sequences(campaign_id);
CREATE INDEX idx_email_templates_sequence ON email_templates(sequence_id);
CREATE INDEX idx_social_proof_events_campaign ON social_proof_events(campaign_id);
CREATE INDEX idx_social_proof_events_created ON social_proof_events(created_at);