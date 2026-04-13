-- Create a trigger to automatically sync new products to catalog table
CREATE OR REPLACE FUNCTION sync_product_to_catalog()
RETURNS trigger AS $$
BEGIN
  -- When a new affiliate link is created, also add to catalog if not exists
  INSERT INTO product_catalog (
    user_id,
    name,
    description,
    price,
    category,
    network,
    affiliate_url,
    commission_rate,
    status
  )
  SELECT 
    NEW.user_id,
    NEW.product_name,
    'Automatically synced from affiliate link',
    0, -- Price will be updated from network
    'General',
    NEW.network,
    NEW.original_url,
    NEW.commission_rate,
    'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM product_catalog 
    WHERE affiliate_url = NEW.original_url 
    AND user_id = NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_product_to_catalog ON affiliate_links;

-- Create trigger on affiliate_links table
CREATE TRIGGER trigger_sync_product_to_catalog
  AFTER INSERT ON affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_to_catalog();