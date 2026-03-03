-- Create product_catalog table
CREATE TABLE IF NOT EXISTS product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  commission_rate NUMERIC(5,2),
  affiliate_url TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  network TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active products" ON product_catalog
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can insert products" ON product_catalog
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_network ON product_catalog(network);