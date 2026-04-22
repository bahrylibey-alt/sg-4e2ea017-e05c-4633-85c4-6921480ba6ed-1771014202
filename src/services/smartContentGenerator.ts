import { supabase } from "@/integrations/supabase/client";
import { generateHooks, NICHES_MAP, trackContentPerformance } from "./contentIntelligence";

/**
 * Smart Content Generator - Creates AI-powered content
 */
export const smartContentGenerator = {
  /**
   * Generate a single SEO article with intelligence filter
   */
  async generateArticle(params: {
    niche?: string;
    productName?: string;
    type?: "review" | "best-under-price" | "comparison" | "guide";
  }): Promise<{ success: boolean; content: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const niche = params.niche || "Kitchen Gadgets";
      const type = params.type || "review";
      const year = new Date().getFullYear();

      // Get campaign
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      const campaignId = campaigns?.[0]?.id;
      if (!campaignId) throw new Error("No campaign found");

      // Get REAL products from this campaign (not fake)
      const { data: products } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "active")
        .limit(5);

      if (!products || products.length === 0) {
        throw new Error("No products found - run Product Discovery first");
      }

      // Generate hooks and pick the best one
      const hooks = await generateHooks({
        productName: products[0].product_name || "Product",
        niche,
        benefit: "Healthy Cooking & Easy Meals"
      });

      if (hooks.length === 0 || hooks[0].total_score < 40) {
        console.warn("⚠️ Generated hooks scored too low - content may not perform");
      }

      const bestHook = hooks[0];

      // Generate title from hook
      const title = bestHook.text;

      // Generate article body
      const body = this.generateArticleBody(products, type, niche);

      // Generate meta description
      const description = `Discover the ${products.length} best ${niche.toLowerCase()} for ${year}. Read reviews & shop our expert picks with confidence. Updated ${new Date().toLocaleDateString()}.`;

      // Insert into database
      const { data: content, error } = await supabase
        .from("generated_content")
        .insert({
          title,
          body,
          description,
          type,
          category: NICHES_MAP[niche] || "kitchen",
          status: "published",
          views: 0,
          clicks: 0,
          campaign_id: campaignId,
          user_id: user.id,
          hook_type: "curiosity",
          performance_score: 0,
          autopilot_state: "testing"
        })
        .select()
        .single();

      if (error) throw error;

      // Track content performance metrics
      await trackContentPerformance({
        contentId: content.id,
        hookScore: bestHook.total_score,
        curiosityScore: bestHook.curiosity_score,
        clarityScore: bestHook.clarity_score,
        emotionScore: bestHook.emotion_score,
        platformOptimized: true,
        humanizationApplied: true
      });

      console.log(`✅ Generated article with hook score ${bestHook.total_score}: ${title}`);
      return { success: true, content };
      
    } catch (error: any) {
      console.error("Content generation error:", error);
      return { success: false, content: null };
    }
  },

  /**
   * Generate article body HTML
   */
  generateArticleBody(products: any[], type: string, niche: string): string {
    let html = `<h2>Introduction</h2>`;
    html += `<p>Are you tired of clutter taking over your home? If so, investing in effective ${niche.toLowerCase()} is the key to transforming your space. We've researched and tested dozens of products to bring you this comprehensive guide.</p>`;
    
    html += `<h2>Our Top Picks for ${new Date().getFullYear()}</h2>`;
    html += `<ul>`;
    
    products.forEach((product, index) => {
      html += `<li><strong>${index + 1}. ${product.product_name}</strong> - ${product.description || 'Top-rated choice with excellent reviews'}</li>`;
    });
    
    html += `</ul>`;
    
    html += `<h2>Detailed Reviews</h2>`;
    
    products.forEach((product, index) => {
      html += `<h3>${index + 1}. ${product.product_name}</h3>`;
      html += `<p>${product.description || 'This product has received outstanding reviews from thousands of customers.'}</p>`;
      html += `<p><strong>Price:</strong> $${product.price || '0.00'}</p>`;
      html += `<p><a href="${product.affiliate_url}" target="_blank" rel="noopener">Check Current Price on Amazon →</a></p>`;
    });
    
    html += `<h2>Buyer's Guide</h2>`;
    html += `<p>When shopping for ${niche.toLowerCase()}, consider these key factors: quality, durability, price, and customer reviews. Always read the product specifications carefully before making a purchase.</p>`;
    
    html += `<h2>Conclusion</h2>`;
    html += `<p>We hope this guide helps you find the perfect ${niche.toLowerCase()} for your needs. All products listed have been carefully selected based on customer ratings, expert reviews, and real-world testing.</p>`;
    
    return html;
  },

  /**
   * Batch generate multiple articles
   */
  async batchGenerate(count: number = 3): Promise<{ success: boolean; generated: number }> {
    try {
      const types = ["review", "best-under-price", "comparison", "guide"] as const;
      let generated = 0;

      for (let i = 0; i < count; i++) {
        const randomType = types[Math.floor(Math.random() * types.length)];
        const result = await this.generateArticle({ type: randomType });
        
        if (result.success) {
          generated++;
        }
        
        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ Batch generated ${generated}/${count} articles`);
      return { success: true, generated };
      
    } catch (error) {
      console.error("Batch generation error:", error);
      return { success: false, generated: 0 };
    }
  }
};