-- Add DNA tracking to generated_content
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS hook_type TEXT,
ADD COLUMN IF NOT EXISTS format_type TEXT,
ADD COLUMN IF NOT EXISTS cta_type TEXT,
ADD COLUMN IF NOT EXISTS dna_hash TEXT;