/**
 * REAL TRAFFIC SOURCES - NO MOCK DATA
 * 
 * This service implements ACTUAL traffic generation methods that work
 * without requiring API keys that users don't have yet.
 */

import { supabase } from "@/integrations/supabase/client";

interface TrafficSource {
  name: string;
  type: "free" | "paid" | "manual";
  difficulty: "easy" | "medium" | "hard";
  estimatedTraffic: number;
  instructions: string[];
  automationLevel: "manual" | "semi-auto" | "full-auto";
  status: "available" | "requires_setup";
}

/**
 * REAL TRAFFIC SOURCES AVAILABLE
 */
export const realTrafficSources: TrafficSource[] = [
  {
    name: "Manual Social Sharing",
    type: "free",
    difficulty: "easy",
    estimatedTraffic: 50,
    automationLevel: "manual",
    status: "available",
    instructions: [
      "Copy your affiliate link from dashboard",
      "Share on Facebook, Twitter, Instagram, TikTok",
      "Post in relevant groups and communities",
      "Add to your bio/profile links",
      "Share in WhatsApp/Telegram groups"
    ]
  },
  {
    name: "SEO - Google Indexing",
    type: "free",
    difficulty: "medium",
    estimatedTraffic: 200,
    automationLevel: "semi-auto",
    status: "available",
    instructions: [
      "System generates sitemap.xml automatically",
      "Submit to Google Search Console (manual step)",
      "System creates SEO-optimized pages for each product",
      "Google will index and rank your pages over 2-4 weeks"
    ]
  },
  {
    name: "Pinterest Organic",
    type: "free",
    difficulty: "easy",
    estimatedTraffic: 300,
    automationLevel: "manual",
    status: "available",
    instructions: [
      "Create Pinterest Business Account (free)",
      "Create boards for product categories",
      "Pin products with your affiliate links",
      "Use product images from affiliate networks",
      "Add keywords to pin descriptions"
    ]
  },
  {
    name: "Reddit Communities",
    type: "free",
    difficulty: "medium",
    estimatedTraffic: 150,
    automationLevel: "manual",
    status: "available",
    instructions: [
      "Find relevant subreddits for your products",
      "Follow community rules (no spam)",
      "Participate in discussions authentically",
      "Share helpful content with your links when appropriate",
      "Focus on value, not just promotion"
    ]
  },
  {
    name: "Email List Building",
    type: "free",
    difficulty: "medium",
    estimatedTraffic: 100,
    automationLevel: "semi-auto",
    status: "available",
    instructions: [
      "Add email signup form to your landing page",
      "Offer incentive (discount, free guide)",
      "System stores emails in database",
      "Send weekly product recommendations manually",
      "Can automate with SendGrid integration later"
    ]
  },
  {
    name: "YouTube Product Reviews",
    type: "free",
    difficulty: "hard",
    estimatedTraffic: 500,
    automationLevel: "manual",
    status: "available",
    instructions: [
      "Create product review videos",
      "Add your affiliate links in description",
      "Use SEO-optimized titles and descriptions",
      "Create thumbnails that get clicks",
      "Post consistently (2-3 videos per week)"
    ]
  },
  {
    name: "TikTok/Reels",
    type: "free",
    difficulty: "medium",
    estimatedTraffic: 1000,
    automationLevel: "manual",
    status: "available",
    instructions: [
      "Create short product showcase videos (15-60 sec)",
      "Add link in bio (link to your dashboard)",
      "Use trending sounds and hashtags",
      "Post daily for best results",
      "Engage with comments"
    ]
  },
  {
    name: "Google Ads",
    type: "paid",
    difficulty: "medium",
    estimatedTraffic: 2000,
    automationLevel: "full-auto",
    status: "requires_setup",
    instructions: [
      "Create Google Ads account",
      "Set daily budget ($10-50/day)",
      "System can help create ad campaigns",
      "Target product-specific keywords",
      "Track ROI and optimize"
    ]
  },
  {
    name: "Facebook Ads",
    type: "paid",
    difficulty: "medium",
    estimatedTraffic: 1500,
    automationLevel: "full-auto",
    status: "requires_setup",
    instructions: [
      "Create Facebook Business Manager",
      "Set up ad account",
      "Upload product images",
      "Target relevant audiences",
      "Start with $5-10/day budget"
    ]
  }
];

/**
 * TRAFFIC GENERATION GUIDE
 */
export const trafficGenerationService = {
  /**
   * Get recommended traffic sources based on user's situation
   */
  getRecommendedSources(hasApiKeys: boolean, hasBudget: boolean): TrafficSource[] {
    if (!hasApiKeys && !hasBudget) {
      // Start with free manual methods
      return realTrafficSources.filter(s => 
        s.type === "free" && 
        (s.automationLevel === "manual" || s.automationLevel === "semi-auto")
      );
    }
    
    if (hasBudget) {
      // Include paid options
      return realTrafficSources.filter(s => s.type === "paid" || s.type === "free");
    }
    
    return realTrafficSources;
  },

  /**
   * Track traffic source activation
   */
  async activateTrafficSource(userId: string, sourceName: string) {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'traffic_source_activated',
        details: `Activated traffic source: ${sourceName}`,
        metadata: {
          source_name: sourceName,
          activation_date: new Date().toISOString()
        },
        status: 'success'
      });

    if (error) {
      console.error('Failed to log traffic source activation:', error);
    }

    return { success: !error };
  },

  /**
   * Generate SEO sitemap for Google indexing
   */
  async generateSitemap(baseUrl: string): Promise<string> {
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('slug, updated_at')
      .eq('status', 'active')
      .limit(1000);

    const urls = links?.map(link => ({
      loc: `${baseUrl}/go/${link.slug}`,
      lastmod: new Date(link.updated_at).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8
    })) || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;

    return sitemap;
  },

  /**
   * Create shareable social media posts
   */
  generateSocialPost(productName: string, link: string, network: string): string {
    const templates = {
      twitter: `🔥 Just found this: ${productName}\n\n${link}\n\n#deals #shopping #affiliate`,
      facebook: `Check out this amazing product I found! ${productName}\n\nGet it here: ${link}`,
      pinterest: `${productName} - Click to shop now!`,
      reddit: `Found a great deal on ${productName}. Thought you might be interested: ${link}`
    };

    return templates[network as keyof typeof templates] || templates.twitter;
  }
};

/**
 * REAL MONEY-MAKING STRATEGIES
 */
export const moneyMakingStrategies = [
  {
    name: "High-Ticket Amazon Products",
    potential: "$500-2000/month",
    difficulty: "medium",
    description: "Promote electronics, appliances, furniture - higher commission per sale",
    actionSteps: [
      "Add Amazon products over $200",
      "Create comparison content",
      "Target buyer-intent keywords",
      "Share in relevant communities"
    ]
  },
  {
    name: "Temu 20% Commission",
    potential: "$300-1000/month",
    difficulty: "easy",
    description: "Temu pays 20% vs Amazon's 4% - promote trending items",
    actionSteps: [
      "Focus on Temu products",
      "Share on TikTok/Instagram",
      "Target price-conscious shoppers",
      "Post daily deals"
    ]
  },
  {
    name: "Email List Monetization",
    potential: "$1000-5000/month",
    difficulty: "hard",
    description: "Build email list, send weekly product recommendations",
    actionSteps: [
      "Add email capture to landing page",
      "Offer free guide/discount",
      "Send 2-3 emails per week",
      "Track open rates and optimize"
    ]
  },
  {
    name: "YouTube Affiliate Channel",
    potential: "$2000-10000/month",
    difficulty: "hard",
    description: "Product reviews generate passive income from views + affiliate sales",
    actionSteps: [
      "Create product unboxing videos",
      "Add affiliate links in description",
      "Post 2-3 videos per week",
      "Build subscriber base"
    ]
  },
  {
    name: "Pinterest Traffic Machine",
    potential: "$500-3000/month",
    difficulty: "medium",
    description: "Pinterest drives high-intent shopping traffic",
    actionSteps: [
      "Create Pinterest Business account",
      "Pin 10-20 products daily",
      "Use product images + keywords",
      "Link to your affiliate links"
    ]
  }
];