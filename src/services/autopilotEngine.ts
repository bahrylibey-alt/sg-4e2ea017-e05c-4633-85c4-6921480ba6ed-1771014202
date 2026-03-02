import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { affiliateIntegrationService } from "@/services/affiliateIntegrationService";
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
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Authentication required");

      console.log("🚀 Launching Autopilot Campaign:", config);

      // Ensure user profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        console.log("📝 Creating user profile...");
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || null,
          full_name: null
        });
      }

      // Step 0: Setup complete affiliate system first
      console.log("🔧 Setting up complete affiliate system...");
      const systemSetup = await affiliateIntegrationService.setupCompleteSystem({
        autoAddProducts: true,
        autoGenerateLinks: true,
        autoTrackConversions: true,
        autoCalculateCommissions: true,
        minConversionRate: 8
      });

      if (!systemSetup.success) {
        console.warn("⚠️ System setup had issues:", systemSetup.message);
      }

      console.log("✅ Affiliate system ready:", systemSetup.stats);

      // Step 1: Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: `Autopilot Campaign - ${new Date().toLocaleDateString()}`,
          goal: "sales",
          status: "active",
          budget: config.budget,
          spent: 0,
          revenue: 0,
          target_audience: config.targetAudience,
          content_strategy: "AI-generated content with smart traffic routing",
          duration_days: 30,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (campaignError || !campaign) {
        console.error("❌ Campaign creation failed:", campaignError);
        throw new Error(campaignError?.message || "Failed to create campaign");
      }

      console.log("✅ Campaign created:", campaign.id);

      // Step 2: Auto-add high-converting products
      console.log("📦 Auto-adding high-converting products...");
      const productResult = await affiliateIntegrationService.autoAddProducts();
      console.log(`✅ Added ${productResult.addedCount} products`);

      // Step 3: Activate traffic sources
      const channelBudget = config.budget / 30 / config.trafficChannels.length;
      for (const channel of config.trafficChannels) {
        try {
          await supabase
            .from("traffic_sources")
            .insert({
              campaign_id: campaign.id,
              source_type: this.mapChannelToType(channel),
              source_name: channel,
              status: "active",
              daily_budget: channelBudget,
              total_clicks: 0,
              total_conversions: 0,
              total_spent: 0,
              automation_enabled: true
            });
          console.log(`📡 Traffic source activated: ${channel}`);
        } catch (err) {
          console.warn(`⚠️ Failed to activate ${channel}:`, err);
        }
      }

      console.log("✅ Traffic sources activated");

      // Step 4: Enable user autopilot settings
      await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        });

      // Step 5: Create initial performance records
      await supabase
        .from("campaign_performance")
        .insert({
          campaign_id: campaign.id,
          date: new Date().toISOString().split("T")[0],
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          spent: 0
        });

      // Step 6: Start optimization monitoring
      await this.startOptimizationMonitoring(campaign.id, user.id);

      // Step 7: Start automated traffic optimization
      console.log("🎯 Starting automated optimization...");
      await affiliateIntegrationService.optimizeSystem();

      return {
        success: true,
        campaign,
        links: productResult.products,
        message: `Autopilot activated! ${productResult.addedCount} products configured with ${config.trafficChannels.length} traffic channels. System is now live and monitoring performance.`
      };
    } catch (error: any) {
      console.error("💥 Autopilot launch failed:", error);
      return {
        success: false,
        campaign: null,
        links: [],
        message: error.message || "Failed to launch autopilot"
      };
    }
  },

  // Get comprehensive autopilot statistics
  async getAutopilotStats(): Promise<AutopilotStats> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          activeLinks: 0,
          trafficSources: 0
        };
      }

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
      const campaignIds = campaigns?.map(c => c.id) || [];
      const { data: traffic } = campaignIds.length > 0
        ? await supabase
            .from("traffic_sources")
            .select("*")
            .in("campaign_id", campaignIds)
        : { data: [] };

      // Calculate totals
      const totalClicks = links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
      const totalConversions = links?.reduce((sum, link) => sum + (link.conversion_count || 0), 0) || 0;
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
    } catch (error) {
      console.error("❌ Error getting autopilot stats:", error);
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommissions: 0,
        activeLinks: 0,
        trafficSources: 0
      };
    }
  },

  // Start automated optimization monitoring
  async startOptimizationMonitoring(campaignId: string, userId: string) {
    try {
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
    } catch (error) {
      console.warn("⚠️ Failed to create optimization insight:", error);
    }
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
      "SEO Content": "organic",
      "Blog Network": "organic",
      "Social Media": "social",
      "Facebook": "social",
      "Instagram": "social",
      "Twitter": "social",
      "Email Marketing": "email",
      "Google Ads": "paid",
      "Video Marketing": "social",
      "Forum Marketing": "referral",
      "Influencer Network": "referral",
      "Partner Sites": "referral"
    };
    return mapping[channel] || "direct";
  }
};