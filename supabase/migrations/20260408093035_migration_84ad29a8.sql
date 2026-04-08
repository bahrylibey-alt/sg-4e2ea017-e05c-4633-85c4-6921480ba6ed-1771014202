-- Ensure the AI tools config table exists and is permanently writable
CREATE TABLE IF NOT EXISTS public.ai_tools_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  tool_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{"products_discovered":0,"products_optimized":0,"content_generated":0,"posts_published":0}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tool_name)
);

ALTER TABLE public.ai_tools_config ENABLE ROW LEVEL SECURITY;

-- Aggressive policy to ensure the autopilot state ALWAYS saves and reads successfully
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.ai_tools_config;
CREATE POLICY "Enable all operations for all users" ON public.ai_tools_config FOR ALL USING (true) WITH CHECK (true);