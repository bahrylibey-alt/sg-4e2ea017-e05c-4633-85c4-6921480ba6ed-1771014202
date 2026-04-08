// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

/**
 * REAL CONTENT GENERATOR SERVICE
 * Generates SEO-optimized articles with affiliate links
 */

const CONTENT_TEMPLATES = {
  review: [
    "Top 10 {products} of {year} for {benefit}",
    "Best {product} Reviews: Expert Picks & Buying Guide {year}",
    "{product} Reviewed - Is It Worth the Money?",
    "The Ultimate {product} Comparison & Review Guide"
  ],
  "best-under-price": [
    "Best {products} Under ${price} - Budget-Friendly Options {year}",
    "Top {products} Under ${price} That Actually Work",
    "Affordable {products} Under ${price} - Best Value Picks",
    "{count} Amazing {products} You Can Buy for Under ${price}"
  ],
  comparison: [
    "{product1} vs {product2}: Which One Should You Buy?",
    "Comparing the Best {products}: Side-by-Side Analysis",
    "{product} Comparison Guide: Find Your Perfect Match",
    "Battle of the {products}: In-Depth Comparison {year}"
  ],
  guide: [
    "The Complete Buying Guide for {products} {year}",
    "How to Choose the Perfect {product}: Expert Guide",
    "{product} Buying Guide: Everything You Need to Know",
    "Your Ultimate Guide to Buying {products} in {year}"
  ]
};

const NICHES_MAP: Record<string, string> = {
  "Kitchen Gadgets": "kitchen",
  "Home Organization": "organization",
  "Car Accessories": "car",
  "Pet Accessories": "pet",
  "Beauty Tools": "beauty",
  "Phone & Tech Accessories": "tech",
  "Fitness at Home": "fitness",
  "Tools & DIY": "tools",
  "Office & Desk Setup": "office",
  "Travel Accessories": "travel"
};

export const smartContentGenerator = {
  /**
   * Generate a single SEO article
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

      // Get products from this campaign
      const { data: products } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .limit(5);

      if (!products || products.length === 0) {
        throw new Error("No products found - run Product Discovery first");
      }

      // Generate title
      const templates = CONTENT_TEMPLATES[type];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const title = template
        .replace("{products}", niche)
        .replace("{product}", products[0].product_name)
        .replace("{product1}", products[0]?.product_name || "Product")
        .replace("{product2}", products[1]?.product_name || "Product")
        .replace("{year}", year.toString())
        .replace("{price}", "50")
        .replace("{count}", products.length.toString())
        .replace("{benefit}", "Healthy Cooking & Easy Meals");

      // Generate article body
      const body = this.generateArticleBody(products, type, niche);

      // Generate meta description
      const description = `Discover the ${products.length} best ${niche.toLowerCase()} for ${year}. Read reviews & shop our expert picks with confidence. Updated ${new Date().toLocaleDateString()}.`;

      // Insert into database
      const { data: content, error } = await supabase
        .from("generated_content" as any)
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
          user_id: user.id
        } as any)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Generated article: ${title}`);
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