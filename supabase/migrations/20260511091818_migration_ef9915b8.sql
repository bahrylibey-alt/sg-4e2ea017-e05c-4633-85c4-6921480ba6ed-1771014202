-- Also fix RLS for generated_content to not require campaign_id
-- Allow NULL campaign_id for content that's not part of a campaign

ALTER TABLE generated_content 
  ALTER COLUMN campaign_id DROP NOT NULL;