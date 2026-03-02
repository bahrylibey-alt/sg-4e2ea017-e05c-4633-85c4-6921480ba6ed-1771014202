-- Add product_id column to affiliate_links table
ALTER TABLE affiliate_links 
ADD COLUMN product_id uuid NULL;

-- Add foreign key constraint to products table if it exists
-- (We'll add index for performance)
CREATE INDEX IF NOT EXISTS idx_affiliate_links_product_id ON affiliate_links(product_id);

-- Add comment for documentation
COMMENT ON COLUMN affiliate_links.product_id IS 'Reference to the product in the catalog';