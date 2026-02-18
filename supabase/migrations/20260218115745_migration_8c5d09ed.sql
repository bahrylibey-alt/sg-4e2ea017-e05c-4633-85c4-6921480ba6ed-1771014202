-- Create ai_content table for storing generated content
CREATE TABLE IF NOT EXISTS ai_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('review', 'comparison', 'blog', 'social', 'email')),
  title TEXT,
  content TEXT NOT NULL,
  product_name TEXT,
  tone TEXT,
  length TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own content" ON ai_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create content" ON ai_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own content" ON ai_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own content" ON ai_content FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_ai_content_user_id ON ai_content(user_id);