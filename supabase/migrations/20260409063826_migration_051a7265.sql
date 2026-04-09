-- Add UNIQUE constraint to trend_products table for upsert operations
ALTER TABLE trend_products 
ADD CONSTRAINT trend_products_asin_unique UNIQUE (asin);