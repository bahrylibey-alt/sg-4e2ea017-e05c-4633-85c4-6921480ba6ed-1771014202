-- Optimization Insights Table (Real conversion optimization tracking)
CREATE TABLE IF NOT EXISTS optimization_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('conversion', 'ux', 'performance', 'content', 'targeting', 'budget')),
  impact_score INTEGER DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed', 'testing')),
  applied_at TIMESTAMP WITH TIME ZONE,
  results_before JSONB,
  results_after JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Allocations Table (Real budget optimization tracking)
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  allocated_budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE optimization_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for optimization_insights
CREATE POLICY "Users can view their optimization insights" ON optimization_insights
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert optimization insights" ON optimization_insights
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their optimization insights" ON optimization_insights
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their optimization insights" ON optimization_insights
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for budget_allocations
CREATE POLICY "Users can view their budget allocations" ON budget_allocations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert budget allocations" ON budget_allocations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their budget allocations" ON budget_allocations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their budget allocations" ON budget_allocations
  FOR DELETE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_optimization_insights_campaign ON optimization_insights(campaign_id);
CREATE INDEX idx_optimization_insights_user ON optimization_insights(user_id);
CREATE INDEX idx_optimization_insights_status ON optimization_insights(status);
CREATE INDEX idx_budget_allocations_campaign ON budget_allocations(campaign_id);
CREATE INDEX idx_budget_allocations_user ON budget_allocations(user_id);