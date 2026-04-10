CREATE TABLE IF NOT EXISTS content_dna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hook_type TEXT,
  format_type TEXT,
  cta_type TEXT,
  platform TEXT,
  dna_hash TEXT NOT NULL,
  performance_score DECIMAL(5,2) DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dna_hash)
);

ALTER TABLE content_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their content DNA"
  ON content_dna FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);