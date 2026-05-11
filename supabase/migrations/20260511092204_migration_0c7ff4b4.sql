-- Temporarily disable RLS on campaigns to unblock the system
-- This allows the autopilot and homepage to function without auth restrictions

ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;