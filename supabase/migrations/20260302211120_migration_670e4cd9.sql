ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS is_autopilot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS daily_budget NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN campaigns.is_autopilot IS 'Flag to identify fully automated campaigns';