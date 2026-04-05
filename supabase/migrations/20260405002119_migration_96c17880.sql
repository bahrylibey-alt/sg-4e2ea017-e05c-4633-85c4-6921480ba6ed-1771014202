-- Add support for more affiliate networks and social platforms
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;

ALTER TABLE integrations ADD CONSTRAINT integrations_provider_check 
CHECK (provider IN (
  -- Payment Processors
  'stripe', 'paypal',
  
  -- Email Marketing
  'mailchimp', 'sendgrid', 'convertkit',
  
  -- Automation
  'zapier', 'make', 'webhooks',
  
  -- Affiliate Networks (EXPANDED)
  'amazon_associates',
  'temu_affiliate',
  'aliexpress_affiliate', 
  'ebay_partner_network',
  'clickbank',
  'shareasale',
  'cj_affiliate',
  'impact',
  'rakuten',
  'awin',
  'flexoffers',
  
  -- Social Media Platforms for Traffic
  'facebook_api',
  'twitter_api',
  'reddit_api',
  'pinterest_api',
  'tiktok_api',
  'instagram_api',
  'linkedin_api',
  'youtube_api',
  
  -- Analytics & Tracking
  'google_analytics',
  'facebook_pixel',
  'tiktok_pixel',
  'google_tag_manager'
));

-- Add helpful comment
COMMENT ON TABLE integrations IS 'Stores all third-party integrations: affiliate networks, social media APIs, payment processors, and analytics tools';

-- Verify the update
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'integrations_provider_check';