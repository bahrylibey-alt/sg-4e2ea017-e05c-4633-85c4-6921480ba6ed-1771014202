-- Create click_events table for real click tracking
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  device_type TEXT,
  converted BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can view clicks for their own links
CREATE POLICY "Users can view their link clicks" ON click_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM affiliate_links 
    WHERE affiliate_links.id = click_events.link_id 
    AND affiliate_links.user_id = auth.uid()
  )
);

-- Create indexes for analytics queries
CREATE INDEX idx_click_events_link_id ON click_events(link_id);
CREATE INDEX idx_click_events_clicked_at ON click_events(clicked_at);
CREATE INDEX idx_click_events_converted ON click_events(converted);