-- Create auto_posts table for tracking published posts
CREATE TABLE IF NOT EXISTS public.auto_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.product_catalog(id) ON DELETE CASCADE,
  product_name TEXT,
  platform TEXT NOT NULL,
  post_url TEXT,
  post_id TEXT,
  caption TEXT,
  hashtags TEXT[],
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  engagement JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "clicks": 0}'::jsonb,
  revenue_generated NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auto_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own auto posts" ON public.auto_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own auto posts" ON public.auto_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto posts" ON public.auto_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_auto_posts_user_id ON public.auto_posts(user_id);
CREATE INDEX idx_auto_posts_platform ON public.auto_posts(platform);
CREATE INDEX idx_auto_posts_posted_at ON public.auto_posts(posted_at);