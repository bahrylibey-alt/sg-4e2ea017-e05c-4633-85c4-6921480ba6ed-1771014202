-- Create content_queue table for automated content generation and posting
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('social_post', 'blog_post', 'forum_reply', 'comment', 'review', 'video_description')),
  platform TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[],
  target_url TEXT,
  hashtags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'scheduled')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  post_id TEXT,
  engagement_score INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their content queue" ON content_queue FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_content_queue_user ON content_queue(user_id);
CREATE INDEX idx_content_queue_status ON content_queue(status);
CREATE INDEX idx_content_queue_scheduled ON content_queue(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_content_queue_campaign ON content_queue(campaign_id) WHERE campaign_id IS NOT NULL;

COMMENT ON TABLE content_queue IS 'Queue of AI-generated content ready for automated posting to drive traffic';