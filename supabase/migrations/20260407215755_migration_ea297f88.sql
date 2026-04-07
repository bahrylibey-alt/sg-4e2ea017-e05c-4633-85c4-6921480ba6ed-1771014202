CREATE TABLE IF NOT EXISTS public.schedule_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  posts_per_day INTEGER DEFAULT 2,
  posting_times JSONB DEFAULT '[]'::jsonb,
  auto_select_products BOOLEAN DEFAULT true,
  use_viral_predictor BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.schedule_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own schedules" ON public.schedule_configs;
CREATE POLICY "Users can manage own schedules" ON public.schedule_configs FOR ALL USING (auth.uid() = user_id);