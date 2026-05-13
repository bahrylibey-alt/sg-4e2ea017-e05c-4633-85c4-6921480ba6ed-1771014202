-- Add policy to allow anonymous/test inserts into product_catalog
-- This enables diagnostic tools to work without authentication
CREATE POLICY "Allow anonymous test inserts" 
ON product_catalog 
FOR INSERT 
TO public
WITH CHECK (true);