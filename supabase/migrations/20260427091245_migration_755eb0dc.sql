ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS autopilot_settings JSONB;