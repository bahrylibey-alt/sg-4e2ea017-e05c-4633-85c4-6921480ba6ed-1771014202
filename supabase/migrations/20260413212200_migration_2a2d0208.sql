-- Step 2: Add new CHECK constraint with all valid post types
ALTER TABLE posted_content 
ADD CONSTRAINT posted_content_post_type_check 
CHECK (post_type = ANY (ARRAY['image', 'video', 'carousel', 'story', 'reel', 'short', 'text', 'product_promo']));