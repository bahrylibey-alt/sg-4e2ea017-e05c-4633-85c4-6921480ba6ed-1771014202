import { supabase } from "@/integrations/supabase/client";

/**
 * SMART CONTENT GENERATOR
 * AI-powered content creation for affiliate marketing
 */

export const smartContentGenerator = {
  /**
   * Generate promotional content for a product
   */
  generateProductContent(product: {
    name: string;
    category: string;
    commission: number;
  }): {
    headline: string;
    description: string;
    cta: string;
    hashtags: string[];
  } {
    const headlines = [
      `🔥 Don't Miss Out: ${product.name} Now Available!`,
      `✨ Transform Your Life with ${product.name}`,
      `🎯 The Ultimate ${product.category} You've Been Waiting For`,
      `💎 Exclusive Deal: ${product.name} Limited Time`,
      `🚀 Upgrade Your ${product.category} Game with ${product.name}`,
    ];

    const descriptions = [
      `Discover why thousands are loving ${product.name}. Premium quality, unbeatable value. Get yours before it's gone!`,
      `${product.name} is changing the ${product.category} game. Join the revolution and experience the difference today.`,
      `Looking for the best ${product.category}? ${product.name} delivers exceptional performance and value. Don't wait!`,
      `Upgrade to ${product.name} and see the difference. Premium features, competitive pricing, backed by thousands of reviews.`,
      `${product.name} - The smart choice for ${product.category}. Quality you can trust, results you can see.`,
    ];

    const ctas = [
      "Shop Now →",
      "Get Yours Today →",
      "Limited Stock - Order Now →",
      "Claim Your Deal →",
      "See Why Everyone's Buying →",
    ];

    const categoryHashtags: Record<string, string[]> = {
      Electronics: ["#TechDeals", "#Electronics", "#Gadgets", "#SmartHome", "#Innovation"],
      Fitness: ["#FitnessGoals", "#HealthyLifestyle", "#Workout", "#FitFam", "#Wellness"],
      Home: ["#HomeDecor", "#InteriorDesign", "#HomeImprovement", "#SmartHome", "#Organization"],
      Kitchen: ["#KitchenGadgets", "#Cooking", "#FoodPrep", "#HomeChef", "#KitchenEssentials"],
      Gaming: ["#Gaming", "#GamerLife", "#ConsoleGaming", "#PCGaming", "#GameDeals"],
    };

    const baseHashtags = ["#AffiliateMarketing", "#ShopNow", "#OnlineDeals", "#BestPrice"];
    const categoryTags = categoryHashtags[product.category] || ["#Deals", "#Shopping"];

    return {
      headline: headlines[Math.floor(Math.random() * headlines.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      cta: ctas[Math.floor(Math.random() * ctas.length)],
      hashtags: [...categoryTags, ...baseHashtags],
    };
  },

  /**
   * Generate email campaign content
   */
  generateEmailCampaign(products: any[]): {
    subject: string;
    preview: string;
    body: string;
  } {
    const subjects = [
      `🎁 Exclusive Deals Just for You - Up to ${Math.round(Math.random() * 30 + 20)}% Off`,
      `⚡ Flash Sale Alert: Premium Products at Unbeatable Prices`,
      `🔥 Hot Picks of the Week - Don't Miss These Deals`,
      `✨ Hand-Picked Recommendations Based on Your Interests`,
      `💰 Save Big on ${products[0]?.product_name || "Top Products"} & More`,
    ];

    const previews = [
      "Limited time offers on products you'll love...",
      "Your personalized selection of premium deals...",
      "Exclusive access to our best offers...",
      "Top-rated products at amazing prices...",
      "Don't miss out on these incredible deals...",
    ];

    const productList = products
      .slice(0, 5)
      .map(
        (p) =>
          `<li><strong>${p.product_name}</strong> - Special pricing available now!</li>`
      )
      .join("\n");

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your Personalized Deals Are Here!</h1>
        <p>We've hand-picked these amazing products just for you:</p>
        <ul style="list-style: none; padding: 0;">
          ${productList}
        </ul>
        <p><strong>Why shop with us?</strong></p>
        <ul>
          <li>✓ Verified products from trusted sellers</li>
          <li>✓ Best prices guaranteed</li>
          <li>✓ Fast, reliable shipping</li>
          <li>✓ Hassle-free returns</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Shop Now
          </a>
        </div>
      </div>
    `;

    return {
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      preview: previews[Math.floor(Math.random() * previews.length)],
      body,
    };
  },

  /**
   * Schedule content for social media
   */
  async scheduleContent(
    userId: string,
    campaignId: string,
    platform: "facebook" | "twitter" | "instagram" | "linkedin",
    content: { headline: string; description: string; hashtags: string[] },
    scheduledFor: Date
  ): Promise<{ success: boolean; id?: string }> {
    try {
      const { data, error } = await supabase
        .from("content_queue")
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          platform,
          content_type: "promotional",
          content: `${content.headline}\n\n${content.description}\n\n${content.hashtags.join(" ")}`,
          scheduled_for: scheduledFor.toISOString(),
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error("Error scheduling content:", error);
      return { success: false };
    }
  },

  /**
   * Generate content calendar for the week
   */
  async generateWeeklyCalendar(
    userId: string,
    campaignId: string,
    products: any[]
  ): Promise<{ success: boolean; scheduled: number }> {
    try {
      let scheduled = 0;
      const platforms: ("facebook" | "twitter" | "instagram")[] = ["facebook", "twitter", "instagram"];
      
      // Schedule 2-3 posts per day for the next 7 days
      for (let day = 0; day < 7; day++) {
        const postsPerDay = Math.floor(Math.random() * 2) + 2; // 2-3 posts

        for (let post = 0; post < postsPerDay; post++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const platform = platforms[Math.floor(Math.random() * platforms.length)];
          
          const content = this.generateProductContent({
            name: product.product_name,
            category: product.network || "General",
            commission: product.commission_rate || 4,
          });

          const scheduledTime = new Date();
          scheduledTime.setDate(scheduledTime.getDate() + day);
          scheduledTime.setHours(9 + post * 4); // Spread throughout the day

          const result = await this.scheduleContent(
            userId,
            campaignId,
            platform,
            content,
            scheduledTime
          );

          if (result.success) scheduled++;
        }
      }

      return { success: true, scheduled };
    } catch (error) {
      console.error("Error generating calendar:", error);
      return { success: false, scheduled: 0 };
    }
  },
};