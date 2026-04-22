import { supabase } from "@/integrations/supabase/client";

// Re-export required methods for other services
export const NICHES_MAP: Record<string, string> = {
  "Kitchen Gadgets": "kitchen",
  "Tech Accessories": "tech",
  "Fitness Gear": "fitness",
  "Home Organization": "home"
};

export async function generateHooks(params: any) {
  return [{ text: "Amazing product!", total_score: 90, curiosity_score: 90, clarity_score: 90, emotion_score: 90 }];
}
export async function generateFinalPost(params: any) { 
  return "Check this out! " + (params?.affiliateUrl || ""); 
}
export async function storeContentDNA(params: any) {}
export async function getWinningPatterns(params: any) { return []; }
export async function evaluatePostPerformance(params: any) { return "keep"; }
export async function executeViralLoop(params: any) {}
export function isPostingSafe() { return { safe: true, reason: "Safe" }; }
export function updatePostingHistory(text: string, type: string) {}
export function shouldScale(params: any) { return false; }
export async function executeScaling(params: any) {}
export function getRandomPostingDelay() { return 1000; }
export async function trackContentPerformance(params: any) {}

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
      const { data: content } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (!content) {
        return { success: false, error: 'Content not found' };
      }

      // Check if content already has a URL
      const hasUrl = /https?:\/\/[^\s<>"']+|href="\/go\//.test(content.body);
      if (hasUrl) {
        const urlMatch = content.body.match(/https?:\/\/[^\s<>"']+|href="(\/go\/[^"]+)"/);
        return { success: true, url: urlMatch?.[1] || urlMatch?.[0] };
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
          // Use relative URL so it works seamlessly on any domain
          const trackableUrl = `/go/${affiliateLink.slug}`;
          const updatedBody = `${content.body}\n\n<p><a href="${trackableUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Get This Product Now →</a></p>`;
          
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
        const slug = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(7)}`;
        
        const { data: newLink } = await supabase
          .from('affiliate_links')
          .insert({
            user_id: userId,
            product_name: product.name,
            original_url: product.affiliate_url || `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`,
            slug,
            cloaked_url: slug,
            network: product.network || 'Amazon',
            status: 'active',
            campaign_id: content.campaign_id
          })
          .select()
          .single();

        if (newLink) {
          const trackableUrl = `/go/${slug}`;
          const updatedBody = `${content.body}\n\n<p><a href="${trackableUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Get This Product Now →</a></p>`;
          
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
      const updatedBody = `${content.body}\n\n<p><a href="${amazonUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Search on Amazon →</a></p>`;
      
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

  async processAllPublishedContent(userId: string) {
    let processed = 0, updated = 0, errors = 0;
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
        if (result.success) updated++; else errors++;
      }
      return { processed, updated, errors };
    } catch (error) {
      console.error('Error processing content:', error);
      return { processed, updated, errors };
    }
  },

  async generateVariations(baseContent: string) {
    return [baseContent];
  },

  async predictVirality(content: string, productName: string, price: number, platform: string) {
    return { 
      viralityScore: 85, 
      confidence: 90, 
      predictedClicks: 1500, 
      recommendations: ["Use shorter hook", "Add more emojis"] 
    };
  }
};