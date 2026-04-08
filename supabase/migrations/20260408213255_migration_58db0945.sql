-- Create magic_tools table for tracking Magic Tool executions
CREATE TABLE IF NOT EXISTS magic_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  last_run TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE magic_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "magic_tools_own" ON magic_tools FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_magic_tools_user ON magic_tools(user_id, tool_name);