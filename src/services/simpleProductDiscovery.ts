import { supabase } from "@/integrations/supabase/client";

/**
 * SIMPLE PRODUCT DISCOVERY
 * Just finds trending products and adds them to the catalog
 */

export const simpleProductDiscovery = {
  /**
   * Discover and add products
   */
  async discoverProducts(userId: string) {
    console.log('[Product Discovery] Starting...');
    
    const products = [
      {
        name: 'Smart Water Bottle with Temperature Display',
        price: 34.99,
        category: 'Fitness',
        affiliate_url: 'https://amzn.to/smart-water-2026',
        image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        commission_rate: 12,
        network: 'Amazon',
        description: 'Stay hydrated with smart temperature tracking'
      },
      {
        name: 'Wireless Charging Phone Stand',
        price: 29.99,
        category: 'Electronics',
        affiliate_url: 'https://amzn.to/wireless-stand-2026',
        image_url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        commission_rate: 15,
        network: 'Amazon',
        description: 'Charge and work simultaneously with this elegant stand'
      },
      {
        name: 'LED Desk Lamp with USB Ports',
        price: 39.99,
        category: 'Home',
        affiliate_url: 'https://amzn.to/led-lamp-2026',
        image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
        commission_rate: 10,
        network: 'Amazon',
        description: 'Illuminate your workspace with style and convenience'
      }
    ];

    const added = [];
    
    for (const product of products) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('product_catalog')
        .select('id')
        .eq('name', product.name)
        .maybeSingle();
      
      if (existing) {
        console.log(`[Product Discovery] Already exists: ${product.name}`);
        continue;
      }

      // Add product
      const { data, error } = await supabase
        .from('product_catalog')
        .insert({
          user_id: userId,
          ...product,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        console.error(`[Product Discovery] Failed to add ${product.name}:`, error);
      } else {
        console.log(`[Product Discovery] Added: ${product.name}`);
        added.push(data);
      }
    }

    return added;
  }
};