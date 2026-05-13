import { supabase } from "@/integrations/supabase/client";

/**
 * SIMPLE CONTENT GENERATOR
 * Just creates simple posts about products
 */

export const simpleContentGenerator = {
  /**
   * Generate content for a product
   */
  async generateContent(userId: string, productId: string, productName: string) {
    console.log(`[Content Generator] Generating for: ${productName}`);
    
    const platforms = [
      { name: 'pinterest', template: '📌 {name}\n\nThis is trending right now! 🔥\n\n#trending #musthave' },
      { name: 'twitter', template: 'Just found {name} and it\'s amazing! 🤩\n\nCheck it out 👇 #affiliate' },
      { name: 'facebook', template: '🔥 {name}\n\nHighly recommended! Has great reviews.\n\n#shopping #deals' },
      { name: 'instagram', template: '✨ {name} ✨\n\nThis is what you\'ve been looking for!\n\n#instagood #trending' },
      { name: 'tiktok', template: '{name} is going viral! 🚀\n\nGet yours before sold out! ⚡\n\n#tiktokmademebuyit' }
    ];

    const generated = [];

    for (const platform of platforms) {
      const content = platform.template.replace(/{name}/g, productName);
      
      const { data, error } = await supabase
        .from('generated_content')
        .insert({
          user_id: userId,
          product_id: productId,
          title: `${platform.name} - ${productName}`,
          body: content,
          type: 'review',
          category: platform.name,
          status: 'ready'
        })
        .select()
        .single();
      
      if (error) {
        console.error(`[Content Generator] Failed for ${platform.name}:`, error);
      } else {
        console.log(`[Content Generator] Created ${platform.name} content`);
        generated.push(data);
      }
    }

    return generated;
  },

  /**
   * Generate content for all products
   */
  async generateForAllProducts(userId: string) {
    console.log('[Content Generator] Generating for all products...');
    
    const { data: products } = await supabase
      .from('product_catalog')
      .select('id, name')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(10);
    
    if (!products || products.length === 0) {
      console.log('[Content Generator] No products found');
      return [];
    }

    const allGenerated = [];
    for (const product of products) {
      const generated = await this.generateContent(userId, product.id, product.name);
      allGenerated.push(...generated);
    }

    return allGenerated;
  }
};