import { supabase } from "@/integrations/supabase/client";

/**
 * FREE TRAFFIC GENERATION ENGINE v2.0
 * REAL traffic tracking - no more mocking
 */

export interface TrafficSource {
  name: string;
  type: "social" | "seo" | "community" | "viral" | "email";
  potentialReach: number;
  conversionRate: number;
  setupComplexity: "easy" | "medium" | "hard";
  timeToResults: string;
  platforms: string[];
}

export const freeTrafficEngine = {
  
  FREE_SOURCES: [
    {
      name: "Reddit Communities",
      type: "community" as const,
      potentialReach: 50000,
      conversionRate: 0.015,
      setupComplexity: "easy" as const,
      timeToResults: "1-3 days",
      platforms: ["reddit.com"]
    },
    {
      name: "Facebook Groups",
      type: "social" as const,
      potentialReach: 100000,
      conversionRate: 0.02,
      setupComplexity: "easy" as const,
      timeToResults: "1-2 days",
      platforms: ["facebook.com"]
    },
    {
      name: "Twitter/X Threads",
      type: "social" as const,
      potentialReach: 75000,
      conversionRate: 0.012,
      setupComplexity: "easy" as const,
      timeToResults: "immediate",
      platforms: ["twitter.com", "x.com"]
    },
    {
      name: "TikTok Organic",
      type: "viral" as const,
      potentialReach: 500000,
      conversionRate: 0.008,
      setupComplexity: "medium" as const,
      timeToResults: "3-7 days",
      platforms: ["tiktok.com"]
    },
    {
      name: "YouTube Shorts",
      type: "viral" as const,
      potentialReach: 300000,
      conversionRate: 0.01,
      setupComplexity: "medium" as const,
      timeToResults: "2-5 days",
      platforms: ["youtube.com"]
    }
  ],

  /**
   * Activate free traffic sources for a campaign (REAL system)
   */
  async activateFreeTraffic(campaignId: string, channels?: string[], campaignData?: any) {
    try {
      console.log("🌐 Activating FREE traffic sources (REAL SYSTEM)...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // Use provided campaign data or fetch it
      let campaign = campaignData;
      
      if (!campaign) {
        const { data: fetchedCampaign, error: fetchError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", campaignId)
          .maybeSingle();

        if (fetchError) {
          console.error("Campaign fetch error:", fetchError);
          throw new Error(`Failed to fetch campaign: ${fetchError.message}`);
        }

        campaign = fetchedCampaign;
      }

      if (!campaign) {
        console.warn("⚠️ Campaign not found");
        return {
          success: false,
          activated: 0,
          sources: [],
          estimatedReach: 0
        };
      }

      // Select sources
      const sourcesToActivate = channels && channels.length > 0
        ? this.FREE_SOURCES.filter(s => channels.includes(s.name) || channels.some(c => s.platforms.includes(c)))
        : this.FREE_SOURCES;

      console.log(`🚀 Activating ${sourcesToActivate.length} free traffic sources`);

      // Update campaign status
      await supabase
        .from("campaigns")
        .update({ 
          status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", campaignId);

      // Generate initial content queue
      await this.generateInitialContent(campaignId, user.id, sourcesToActivate);

      const totalReach = sourcesToActivate.reduce((sum, s) => sum + s.potentialReach, 0);

      console.log("✅ Free traffic sources activated - Content queued for posting");

      return {
        success: true,
        activated: sourcesToActivate.length,
        sources: sourcesToActivate.map(s => ({
          name: s.name,
          platform: s.platforms[0],
          reach: s.potentialReach
        })),
        estimatedReach: totalReach
      };

    } catch (err) {
      console.error("Free traffic activation error:", err);
      return {
        success: false,
        activated: 0,
        sources: [],
        estimatedReach: 0,
        error: err instanceof Error ? err.message : "Activation failed"
      };
    }
  },

  /**
   * Generate content for free traffic sources (REAL content queue)
   */
  async generateInitialContent(campaignId: string, userId: string, sources: typeof this.FREE_SOURCES) {
    try {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("name, goal")
        .eq("id", campaignId)
        .single();

      if (!campaign) return;

      // Get affiliate links for this campaign
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("cloaked_url, product_name")
        .eq("campaign_id", campaignId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      const linkUrl = links?.cloaked_url || "your-link";
      const productName = links?.product_name || campaign.name;

      const contentPieces = [];

      for (const source of sources) {
        const content = this.generateContentForPlatform(source.name, campaign, linkUrl, productName);
        
        contentPieces.push({
          campaign_id: campaignId,
          user_id: userId,
          content_type: this.getContentType(source.type),
          content: content.text,
          platform: source.platforms[0],
          status: "ready",
          scheduled_for: new Date(Date.now() + Math.random() * 3600000).toISOString()
        });
      }

      const { error } = await supabase
        .from("content_queue")
        .insert(contentPieces);

      if (!error) {
        console.log(`✅ Generated ${contentPieces.length} content pieces for posting`);
      } else {
        console.error("Error queuing content:", error);
      }

    } catch (err) {
      console.error("Content generation error:", err);
    }
  },

  /**
   * Generate platform-specific content
   */
  generateContentForPlatform(platform: string, campaign: any, linkUrl: string, productName: string) {
    const goal = campaign.goal || "success";
    
    const templates: Record<string, string[]> = {
      "Reddit Communities": [
        `I've been using ${productName} for ${goal} and it's incredible. Thought I'd share: ${linkUrl}`,
        `Just discovered this amazing resource for ${goal}. Game changer: ${linkUrl}`
      ],
      "Facebook Groups": [
        `🔥 Found something amazing for ${goal}!\n\nJust wanted to share ${productName} with the group because it's been so helpful.\n\nCheck it out: ${linkUrl}`
      ],
      "Twitter/X Threads": [
        `🚀 Transform your ${goal} strategy with ${productName}\n\nI've been using it for weeks and the results speak for themselves\n\nThread 🧵\n\n${linkUrl}`
      ]
    };

    const platformTemplates = templates[platform] || [
      `Check out ${productName} for ${goal}: ${linkUrl}`,
      `Highly recommended for ${goal}: ${linkUrl}`
    ];
    
    const text = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];

    return { text };
  },

  /**
   * Get content type for platform
   */
  getContentType(type: string): string {
    switch (type) {
      case "viral": return "video";
      case "seo": return "article";
      case "community": return "comment";
      default: return "social_post";
    }
  },

  /**
   * Get REAL traffic statistics from database
   */
  async getTrafficStats(campaignId?: string) {
    try {
      let query = supabase
        .from("affiliate_links")
        .select("clicks, conversions, revenue");

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data: links } = await query;

      const totalClicks = links?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
      const totalConversions = links?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0;
      const totalRevenue = links?.reduce((sum, l) => sum + (Number(l.revenue) || 0), 0) || 0;

      return {
        totalClicks,
        totalConversions,
        totalRevenue,
        conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00",
        avgDailyClicks: totalClicks
      };
    } catch (err) {
      console.error("Stats error:", err);
      return {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: "0.00",
        avgDailyClicks: 0
      };
    }
  }
};