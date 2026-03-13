import { supabase } from "@/integrations/supabase/client";

/**
 * FREE TRAFFIC GENERATION ENGINE
 * Next-generation traffic acquisition from 100% free sources
 */

export interface TrafficSource {
  name: string;
  type: "social" | "seo" | "community" | "viral" | "email";
  potentialReach: number;
  conversionRate: number;
  setupComplexity: "easy" | "medium" | "hard";
  timeToResults: string;
}

export const freeTrafficEngine = {
  
  /**
   * All free traffic sources available
   */
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
    },
    {
      name: "Pinterest Pins",
      type: "social" as const,
      potentialReach: 80000,
      conversionRate: 0.025,
      setupComplexity: "easy" as const,
      timeToResults: "3-7 days",
      platforms: ["pinterest.com"]
    },
    {
      name: "LinkedIn Posts",
      type: "social" as const,
      potentialReach: 60000,
      conversionRate: 0.018,
      setupComplexity: "easy" as const,
      timeToResults: "1-2 days",
      platforms: ["linkedin.com"]
    },
    {
      name: "Quora Answers",
      type: "community" as const,
      potentialReach: 40000,
      conversionRate: 0.022,
      setupComplexity: "medium" as const,
      timeToResults: "2-4 days",
      platforms: ["quora.com"]
    },
    {
      name: "Medium Articles",
      type: "seo" as const,
      potentialReach: 35000,
      conversionRate: 0.028,
      setupComplexity: "medium" as const,
      timeToResults: "5-10 days",
      platforms: ["medium.com"]
    },
    {
      name: "Instagram Reels",
      type: "viral" as const,
      potentialReach: 200000,
      conversionRate: 0.009,
      setupComplexity: "medium" as const,
      timeToResults: "2-4 days",
      platforms: ["instagram.com"]
    }
  ],

  /**
   * Activate free traffic sources for a campaign
   */
  async activateFreeTraffic(campaignId: string, selectedSources?: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // Get campaign details
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("*, affiliate_links(*)")
        .eq("id", campaignId)
        .single();

      if (!campaign) throw new Error("Campaign not found");

      // Select sources (use all if none specified)
      const sourcesToActivate = selectedSources && selectedSources.length > 0
        ? this.FREE_SOURCES.filter(s => selectedSources.includes(s.name))
        : this.FREE_SOURCES;

      console.log(`🚀 Activating ${sourcesToActivate.length} free traffic sources`);

      // Create traffic source configurations
      const configs = sourcesToActivate.map(source => ({
        campaign_id: campaignId,
        source_name: source.name,
        source_type: source.type,
        platform_url: source.platforms[0],
        is_free: true,
        auto_post_enabled: true,
        post_frequency_hours: this.getPostFrequency(source.setupComplexity),
        status: "active"
      }));

      const { data: created, error } = await supabase
        .from("traffic_sources_config")
        .insert(configs)
        .select();

      if (error) throw error;

      // Generate initial content for each source
      await this.generateInitialContent(campaignId, sourcesToActivate);

      return {
        success: true,
        activated: created?.length || 0,
        sources: created,
        estimatedReach: sourcesToActivate.reduce((sum, s) => sum + s.potentialReach, 0)
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
   * Generate content for free traffic sources
   */
  async generateInitialContent(campaignId: string, sources: typeof this.FREE_SOURCES) {
    try {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("name, goal, content_strategy, affiliate_links(*)")
        .eq("id", campaignId)
        .single();

      if (!campaign) return;

      const contentPieces = [];

      for (const source of sources) {
        // Generate platform-specific content
        const content = this.generateContentForPlatform(source.name, campaign);
        
        contentPieces.push({
          campaign_id: campaignId,
          content_type: this.getContentType(source.type),
          content_text: content.text,
          content_media_url: content.mediaUrl,
          platform: source.name,
          status: "ready",
          scheduled_for: new Date(Date.now() + Math.random() * 3600000).toISOString() // Random within 1 hour
        });
      }

      await supabase
        .from("content_queue")
        .insert(contentPieces);

      console.log(`✅ Generated ${contentPieces.length} content pieces`);

    } catch (err) {
      console.error("Content generation error:", err);
    }
  },

  /**
   * Generate platform-specific content
   */
  generateContentForPlatform(platform: string, campaign: any) {
    const link = campaign.affiliate_links?.[0]?.short_url || "link";
    
    const templates: Record<string, string[]> = {
      "Reddit Communities": [
        `I've been using this ${campaign.goal} solution and it's incredible. Thought I'd share: ${link}`,
        `Just discovered this amazing resource for ${campaign.goal}. Game changer: ${link}`,
        `For anyone interested in ${campaign.goal}, this is worth checking out: ${link}`
      ],
      "Facebook Groups": [
        `🔥 Found something amazing for ${campaign.goal}!\n\nJust wanted to share this with the group because it's been so helpful.\n\nCheck it out: ${link}`,
        `Hey everyone! 👋\n\nI came across this ${campaign.goal} solution that I think you'll love.\n\nMore info: ${link}`
      ],
      "Twitter/X Threads": [
        `🚀 Transform your ${campaign.goal} strategy with this powerful tool\n\nI've been using it for weeks and the results speak for themselves\n\nThread 🧵\n\n${link}`,
        `Here's what nobody tells you about ${campaign.goal} 👇\n\nAfter testing 10+ solutions, this one stands out\n\n${link}`
      ],
      "TikTok Organic": [
        `POV: You just discovered the ultimate ${campaign.goal} hack 🤯\n\nLink in bio! #${campaign.goal.replace(/\s+/g, "")}`,
        `This changed everything for my ${campaign.goal} 😱\n\nTap the link! #success #transformation`
      ],
      "Instagram Reels": [
        `The ${campaign.goal} secret everyone's talking about 🔥\n\nTap link in bio to learn more!\n\n#${campaign.goal} #success #transformation`,
        `Watch how this transforms your ${campaign.goal} 🚀\n\nLink in bio for full details!`
      ],
      "LinkedIn Posts": [
        `After analyzing 100+ ${campaign.goal} solutions, here's what actually works:\n\nThis approach delivers consistent results without breaking the bank.\n\nFull breakdown: ${link}`,
        `3 lessons from implementing this ${campaign.goal} strategy:\n\n1. Results compound over time\n2. Consistency beats intensity\n3. Simple systems win\n\nLearn more: ${link}`
      ]
    };

    const platformTemplates = templates[platform] || templates["Twitter/X Threads"];
    const text = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];

    return {
      text,
      mediaUrl: null // Would integrate with image generation API
    };
  },

  /**
   * Get post frequency based on complexity
   */
  getPostFrequency(complexity: "easy" | "medium" | "hard"): number {
    switch (complexity) {
      case "easy": return 2; // Every 2 hours
      case "medium": return 4; // Every 4 hours
      case "hard": return 8; // Every 8 hours
      default: return 4;
    }
  },

  /**
   * Get content type for platform
   */
  getContentType(type: string): "social_post" | "video" | "article" | "comment" {
    switch (type) {
      case "viral": return "video";
      case "seo": return "article";
      case "community": return "comment";
      default: return "social_post";
    }
  },

  /**
   * Get active traffic sources for campaign
   */
  async getActiveTrafficSources(campaignId: string) {
    const { data, error } = await supabase
      .from("traffic_sources_config")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("status", "active");

    if (error) {
      console.error("Failed to fetch traffic sources:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get traffic statistics
   */
  async getTrafficStats(campaignId: string) {
    try {
      const { data: metrics } = await supabase
        .from("automation_metrics")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("metric_date", { ascending: false })
        .limit(30);

      const totalClicks = metrics?.reduce((sum, m) => sum + (m.clicks_generated || 0), 0) || 0;
      const totalConversions = metrics?.reduce((sum, m) => sum + (m.conversions_tracked || 0), 0) || 0;
      const totalRevenue = metrics?.reduce((sum, m) => sum + (m.revenue_generated || 0), 0) || 0;

      return {
        totalClicks,
        totalConversions,
        totalRevenue,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : "0.00",
        avgDailyClicks: metrics && metrics.length > 0 ? Math.round(totalClicks / metrics.length) : 0
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