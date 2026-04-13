-- Add link health tracking columns to affiliate_links table
ALTER TABLE affiliate_links 
ADD COLUMN IF NOT EXISTS is_working BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS check_failures INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster health checks
CREATE INDEX IF NOT EXISTS idx_affiliate_links_health 
ON affiliate_links(user_id, is_working, check_failures) 
WHERE status = 'active';

-- Verify columns added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'affiliate_links'
  AND column_name IN ('is_working', 'check_failures', 'last_checked_at');