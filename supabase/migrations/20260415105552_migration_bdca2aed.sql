-- Fix: Update existing integrations to use allowed category values
UPDATE integrations 
SET category = 'affiliate_network'
WHERE user_id = 'cd9e03a2-9620-44be-a934-ac2ed69db465' 
  AND provider IN ('temu_affiliate', 'aliexpress_affiliate', 'clickbank', 'shareasale', 'ebay_partner_network');

-- Now we can safely add the constraint
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_category_check;

ALTER TABLE integrations 
ADD CONSTRAINT integrations_category_check 
CHECK (category IN ('payment', 'email', 'automation', 'affiliate_network', 'analytics', 'tracking'));

-- Insert traffic sources using the correct provider names and category
INSERT INTO integrations (user_id, provider, provider_name, category, status, created_at, updated_at)
VALUES 
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'pinterest_api', 'Pinterest Auto-Pinning', 'tracking', 'connected', NOW(), NOW()),
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'tiktok_api', 'TikTok Video Posts', 'tracking', 'connected', NOW(), NOW()),
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'twitter_api', 'Twitter/X Auto-Posting', 'tracking', 'connected', NOW(), NOW()),
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'facebook_api', 'Facebook Group Sharing', 'tracking', 'connected', NOW(), NOW()),
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'instagram_api', 'Instagram Stories', 'tracking', 'connected', NOW(), NOW()),
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'reddit_api', 'Reddit Deals', 'tracking', 'connected', NOW(), NOW()),
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'linkedin_api', 'LinkedIn Articles', 'tracking', 'connected', NOW(), NOW()),
  ('cd9e03a2-9620-44be-a934-ac2ed69db465', 'youtube_api', 'YouTube Community', 'tracking', 'connected', NOW(), NOW())
ON CONFLICT (user_id, provider) DO UPDATE 
SET 
  status = 'connected',
  updated_at = NOW();

-- Verify all integrations
SELECT provider, provider_name, category, status 
FROM integrations 
WHERE user_id = 'cd9e03a2-9620-44be-a934-ac2ed69db465'
ORDER BY category, provider;