ALTER TABLE affiliate_links 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS short_code TEXT,
ADD COLUMN IF NOT EXISTS original_url TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_short_code ON affiliate_links(short_code);