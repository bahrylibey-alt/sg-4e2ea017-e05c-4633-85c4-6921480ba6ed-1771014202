-- Create affiliate_links table for real link tracking
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  cloaked_url TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  product_name TEXT,
  network TEXT, -- Amazon, ClickBank, ShareASale, etc.
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own links" ON affiliate_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own links" ON affiliate_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own links" ON affiliate_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own links" ON affiliate_links FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX idx_affiliate_links_slug ON affiliate_links(slug);