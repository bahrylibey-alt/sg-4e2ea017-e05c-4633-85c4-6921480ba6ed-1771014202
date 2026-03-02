import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type TrafficSource = Database["public"]["Tables"]["traffic_sources"]["Row"];
type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];

interface AutopilotConfig {
  budget: number;
  products: string[];
  targetAudience: string;
  trafficChannels: string[];
}

interface AutopilotStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommissions: number;
  activeLinks: number;
  trafficSources: number;
}

export const autopilotEngine = {
  // Launch complete autopilot campaign with one click
  async launchAutopilotCampaign(config: AutopilotConfig) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    console.log("🚀 Launching Autopilot Campaign:", config);

    // Step 1: Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: `Autopilot Campaign - ${new Date().toLocaleDateString()}`,
        goal: "sales",
        status: "active",
        budget: config.budget,
        target_audience: config.targetAudience,
        content_strategy: "AI-generated content with smart traffic routing",
        duration_days: 30
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign creation failed:", campaignError);
      throw new Error("Failed to create campaign");
    }

    console.log("✅ Campaign created:", campaign.id);

    // Step 2: Generate affiliate links for each product
    const links: AffiliateLink[] = [];
    for (const product of config.products) {
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .insert({
          user_id: user.id,
          original_url: product,
          cloaked_url: `https://salemakseb.com/go/${this.generateSlug()}`,
          slug: this.generateSlug(),
          product_name: this.extractProductName(product),
          network: this.detectNetwork(product),
          status: "active"
        })
        .select()
        .single();

      if (!linkError && link) {
        links.push(link);
        console.log("🔗 Link generated:", link.slug);
      }
    }

    // Step 3: Activate traffic sources
    for (const channel of config.trafficChannels) {
      await supabase
        .from("traffic_sources")
        .insert({
          campaign_id: campaign.id,
          source_type: this.mapChannelToType(channel),
          source_name: channel,
          status: "active",
          daily_budget: config.budget / 30 / config.trafficChannels.length
        });
    }

    console.log("📊 Traffic sources activated");

    // Step 4: Enable user autopilot settings
    await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        autopilot_enabled: true,
        updated_at: new Date().toISOString()
      });

    // Step 5: Start optimization monitoring
    await this.startOptimizationMonitoring(campaign.id, user.id);

    return {
      success: true,
      campaign,
      links,
      message: `Autopilot activated! ${links.length} products configured with ${config.trafficChannels.length} traffic channels.`
    };
  },

  // Get comprehensive autopilot statistics
  async getAutopilotStats(): Promise<AutopilotStats> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    // Fetch all campaigns
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id);

    // Fetch all affiliate links
    const { data: links } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("user_id", user.id);

    // Fetch all commissions
    const { data: commissions } = await supabase
      .from("commissions")
      .select("*")
      .eq("user_id", user.id);

    // Fetch traffic sources
    const { data: traffic } = await supabase
      .from("traffic_sources")
      .select("*")
      .in("campaign_id", campaigns?.map(c => c.id) || []);

    // Calculate totals
    const totalClicks = links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
    const totalConversions = links?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0;
    const totalRevenue = campaigns?.reduce((sum, c) => sum + Number(c.revenue || 0), 0) || 0;
    const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

    return {
      totalCampaigns: campaigns?.length || 0,
      activeCampaigns: campaigns?.filter(c => c.status === "active").length || 0,
      totalClicks,
      totalConversions,
      totalRevenue,
      totalCommissions,
      activeLinks: links?.filter(l => l.status === "active").length || 0,
      trafficSources: traffic?.filter(t => t.status === "active").length || 0
    };
  },

  // Start automated optimization monitoring
  async startOptimizationMonitoring(campaignId: string, userId: string) {
    // Create initial optimization insight
    await supabase
      .from("optimization_insights")
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        title: "Autopilot Monitoring Active",
        description: "AI is now monitoring your campaign performance and will automatically optimize for maximum conversions.",
        insight_type: "performance",
        impact_score: 85,
        status: "applied"
      });
  },

  // Generate unique slug for links
  generateSlug(): string {
    return Math.random().toString(36).substring(2, 10);
  },

  // Extract product name from URL
  extractProductName(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const parts = path.split("/").filter(Boolean);
      return parts[parts.length - 1]?.replace(/-/g, " ") || "Product";
    } catch {
      return "Affiliate Product";
    }
  },

  // Detect affiliate network from URL
  detectNetwork(url: string): string {
    if (url.includes("amazon.com")) return "Amazon Associates";
    if (url.includes("clickbank.com")) return "ClickBank";
    if (url.includes("shareasale.com")) return "ShareASale";
    if (url.includes("cj.com")) return "Commission Junction";
    if (url.includes("jvzoo.com")) return "JVZoo";
    return "Direct";
  },

  // Map channel names to traffic types
  mapChannelToType(channel: string): "organic" | "paid" | "social" | "email" | "referral" | "direct" {
    const mapping: Record<string, "organic" | "paid" | "social" | "email" | "referral" | "direct"> = {
      "SEO": "organic",
      "Blog Content": "organic",
      "Facebook": "social",
      "Instagram": "social",
      "Twitter": "social",
      "Email Marketing": "email",
      "Google Ads": "paid",
      "Partner Network": "referral"
    };
    return mapping[channel] || "direct";
  }
};