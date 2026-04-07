-- Add sitemap generation endpoint data
CREATE TABLE IF NOT EXISTS public.seo_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  sitemap_url TEXT,
  google_console_verified BOOLEAN DEFAULT false,
  last_sitemap_generation TIMESTAMP WITH TIME ZONE,
  indexed_pages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);