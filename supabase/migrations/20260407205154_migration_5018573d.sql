-- Create email_subscribers table for real email list building
CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_subscribe" ON public.email_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "authenticated_can_view" ON public.email_subscribers FOR SELECT USING (auth.uid() IS NOT NULL);