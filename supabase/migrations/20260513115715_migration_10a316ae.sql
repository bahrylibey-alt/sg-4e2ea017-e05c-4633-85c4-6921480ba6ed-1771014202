-- Fix RLS policies properly - PostgreSQL syntax
-- Remove old policies and create new ones

-- Product Catalog
DROP POLICY IF EXISTS "Allow anonymous test inserts" ON product_catalog;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON product_catalog;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON product_catalog;

CREATE POLICY "auth_users_manage_products" 
ON product_catalog 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Generated Content
DROP POLICY IF EXISTS "Users manage own generated content" ON generated_content;
DROP POLICY IF EXISTS "Authenticated users manage content" ON generated_content;

CREATE POLICY "auth_users_manage_content" 
ON generated_content 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Posted Content
DROP POLICY IF EXISTS "Users manage own posts" ON posted_content;
DROP POLICY IF EXISTS "Authenticated users manage posts" ON posted_content;

CREATE POLICY "auth_users_manage_posts" 
ON posted_content 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System State
DROP POLICY IF EXISTS "Users manage own state" ON system_state;
CREATE POLICY "auth_users_manage_state" 
ON system_state 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User Settings
DROP POLICY IF EXISTS "Users manage own settings" ON user_settings;
CREATE POLICY "auth_users_manage_settings" 
ON user_settings 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);