-- Create integrations table to store real third-party connections
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Integration details
  provider TEXT NOT NULL, -- 'stripe', 'mailchimp', 'zapier', 'amazon_associates', etc.
  provider_name TEXT NOT NULL, -- Human-readable name
  provider_logo TEXT NULL, -- Logo URL or emoji
  category TEXT NOT NULL, -- 'payment', 'email', 'automation', 'affiliate_network'
  
  -- Connection status
  status TEXT NOT NULL DEFAULT 'disconnected',
  connected_at TIMESTAMP WITH TIME ZONE NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Authentication data (encrypted in production)
  access_token TEXT NULL,
  refresh_token TEXT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Provider-specific configuration
  config JSONB NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  error_message TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT integrations_provider_check CHECK (provider IN (
    'stripe', 'paypal', 'mailchimp', 'zapier', 'make', 'webhooks',
    'amazon_associates', 'clickbank', 'shareasale', 'cj_affiliate',
    'google_analytics', 'facebook_pixel', 'tiktok_pixel'
  )),
  CONSTRAINT integrations_category_check CHECK (category IN (
    'payment', 'email', 'automation', 'affiliate_network', 'analytics', 'tracking'
  )),
  CONSTRAINT integrations_status_check CHECK (status IN (
    'connected', 'disconnected', 'error', 'pending'
  )),
  
  -- Ensure one integration per provider per user
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own integrations"
  ON integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_user_provider ON integrations(user_id, provider, status);

-- Insert default integration records for existing users
INSERT INTO integrations (user_id, provider, provider_name, provider_logo, category, status)
SELECT 
  id,
  'stripe',
  'Stripe',
  '💳',
  'payment',
  'disconnected'
FROM profiles
ON CONFLICT (user_id, provider) DO NOTHING;

COMMENT ON TABLE integrations IS 'Stores third-party service integrations with OAuth tokens and configuration';
COMMENT ON COLUMN integrations.config IS 'Provider-specific settings like API keys, webhook URLs, account IDs';