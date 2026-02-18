-- Create commissions table for real earnings tracking
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2),
  product_name TEXT,
  network TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  transaction_id TEXT,
  customer_id TEXT,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own commissions" ON commissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create commissions" ON commissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own commissions" ON commissions FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_commissions_user_id ON commissions(user_id);
CREATE INDEX idx_commissions_link_id ON commissions(link_id);
CREATE INDEX idx_commissions_status ON commissions(status);