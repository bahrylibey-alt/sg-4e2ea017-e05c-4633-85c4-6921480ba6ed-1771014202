-- Add UNIQUE constraint to magic_tools table for upsert operations
ALTER TABLE magic_tools 
ADD CONSTRAINT magic_tools_user_id_tool_name_unique UNIQUE (user_id, tool_name);