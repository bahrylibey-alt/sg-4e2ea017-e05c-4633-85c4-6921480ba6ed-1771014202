import { supabase } from "@/integrations/supabase/client";

/**
 * Content Intelligence Service
 * Ensures all generated content has proper affiliate URLs embedded
 */
export const contentIntelligence = {
  /**
   * Inject affiliate URLs into generated content body
   */
  async injectAffiliateUrls(
    contentId: string,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Get the content
      const { data: content } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (!content) {
        return { success: false, error: 'Content not found' };
      }

      // Check if content already has a URL
      const hasUrl = /https?:\/\/[^\s<>"']+/.test(content.body);
      if (hasUrl) {
        const urlMatch = content.body.match(/https?:\/\/[^\s<>"']+/);
        return { success: true, url: urlMatch?.[0] };
      }

      // Find related affiliate link by campaign_id
      if (content.campaign_id) {
        const { data: affiliateLink } = await supabase
          .from('affiliate_links')
          .select('original_url, slug, product_name')
          .eq('campaign_id', content.campaign_id)
          .eq('status', 'active')
          .maybeSingle();

        if (affiliateLink?.original_url) {
          // Create trackable URL using our domain
          const trackableUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'}/go/${affiliateLink.slug}`;
          
          // Inject URL into content body
          const updatedBody = `${content.body}\n\n<a href="${trackableUrl}" target="_blank" rel="noopener">Get this product now →</a>`;
          
          await supabase
            .from('generated_content')
            .update({ 
              body: updatedBody,
              updated_at: new Date().toISOString()
            })
            .eq('id', contentId);

          return { success: true, url: trackableUrl };
        }
      }

      // Fallback: Find any related product and create affiliate link
      const { data: products } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (products && products.length > 0) {
        const product = products[0];
        
        // Create new affiliate link
        const slug = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(7)}`;
        
        const { data: newLink } = await supabase
          .from('affiliate_links')
          .insert({
            user_id: userId,
            product_name: product.name,
            original_url: product.affiliate_url || `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`,
            slug,
            network: product.network || 'Amazon',
            status: 'active',
            campaign_id: content.campaign_id
          })
          .select()
          .single();

        if (newLink) {
          const trackableUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'}/go/${slug}`;
          
          const updatedBody = `${content.body}\n\n<a href="${trackableUrl}" target="_blank" rel="noopener">Get this product now →</a>`;
          
          await supabase
            .from('generated_content')
            .update({ 
              body: updatedBody,
              updated_at: new Date().toISOString()
            })
            .eq('id', contentId);

          return { success: true, url: trackableUrl };
        }
      }

      // Last resort: Generic Amazon search
      const productName = content.title.replace(/^Review:\s*/, '').replace(/\s*-\s*\d+$/, '');
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`;
      
      const updatedBody = `${content.body}\n\n<a href="${amazonUrl}" target="_blank" rel="noopener">Search on Amazon →</a>`;
      
      await supabase
        .from('generated_content')
        .update({ 
          body: updatedBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      return { success: true, url: amazonUrl };

    } catch (error: any) {
      console.error('Error injecting URLs:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Process all published content to ensure URLs are embedded
   */
  async processAllPublishedContent(userId: string): Promise<{
    processed: number;
    updated: number;
    errors: number;
  }> {
    let processed = 0;
    let updated = 0;
    let errors = 0;

    try {
      const { data: content } = await supabase
        .from('generated_content')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'published')
        .limit(100);

      if (!content) return { processed, updated, errors };

      for (const item of content) {
        processed++;
        const result = await this.injectAffiliateUrls(item.id, userId);
        if (result.success) {
          updated++;
        } else {
          errors++;
        }
      }

      return { processed, updated, errors };
    } catch (error) {
      console.error('Error processing content:', error);
      return { processed, updated, errors };
    }
  }
};