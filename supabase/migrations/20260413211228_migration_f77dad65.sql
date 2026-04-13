-- Add user_id column to product_catalog if missing
ALTER TABLE product_catalog 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Update existing products with user_id from first user
UPDATE product_catalog
SET user_id = (SELECT id FROM profiles LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE product_catalog 
ALTER COLUMN user_id SET NOT NULL;