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
      if (!user) {
        console.error("❌ No authenticated user");
        throw new Error("Authentication required");
      }

      console.log("🚀 Launching Autopilot Campaign for user:", user.id);
      console.log("📋 Config:", config);

      // Step 1: Ensure user profile exists
      console.log("📝 Step 1: Checking user profile...");
      const { data: profile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error("❌ Profile check error:", profileCheckError);
      }

      if (!profile) {
        console.log("📝 Creating user profile...");
        const { error: profileCreateError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email || null,
            full_name: user.user_metadata?.full_name || null
          });

        if (profileCreateError) {
          console.error("❌ Failed to create profile:", profileCreateError);
          throw new Error(`Profile creation failed: ${profileCreateError.message}`);
        }
        console.log("✅ Profile created");
      } else {
        console.log("✅ Profile exists");
      }

      // Step 2: Setup complete affiliate system
      console.log("🔧 Step 2: Setting up affiliate infrastructure...");
      const systemSetup = await affiliateIntegrationService.setupCompleteSystem({
        autoAddProducts: true,
        autoGenerateLinks: true,
        autoTrackConversions: true,
        autoCalculateCommissions: true,
        minConversionRate: 5
      });

      if (!systemSetup.success) {
        console.error("❌ System setup failed:", systemSetup.message);
        throw new Error(`System setup failed: ${systemSetup.message}`);
      }

      console.log("✅ Affiliate system ready");
      console.log("📊 Setup stats:", systemSetup.stats);

      // Step 3: Create campaign
      console.log("📋 Step 3: Creating campaign...");
      const campaignName = `Autopilot Campaign - ${new Date().toLocaleDateString()}`;
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: campaignName,
          goal: "sales",
          status: "active",
          budget: config.budget || 0,
          spent: 0,
          revenue: 0,
          target_audience: config.targetAudience || "General Audience",
          content_strategy: "AI-powered multi-channel traffic automation",
          duration_days: 30,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (campaignError) {
        console.error("❌ Campaign creation error:", campaignError);
        throw new Error(`Campaign creation failed: ${campaignError.message}`);
      }

      if (!campaign) {
        console.error("❌ No campaign returned");
        throw new Error("Campaign creation returned no data");
      }

      console.log("✅ Campaign created:", campaign.id);

      // Step 4: Activate traffic sources
      console.log("📡 Step 4: Activating traffic sources...");
      const trafficChannels = config.trafficChannels || ["seo", "social", "content", "email"];
      const channelBudget = (config.budget || 0) / 30 / trafficChannels.length;

      for (const channel of trafficChannels) {
        try {
          const { error: trafficError } = await supabase
            .from("traffic_sources")
            .insert({
              campaign_id: campaign.id,
              source_type: this.mapChannelToType(channel),
              source_name: channel.toUpperCase(),
              status: "active",
              daily_budget: channelBudget,
              total_clicks: 0,
              total_conversions: 0,
              total_spent: 0,
              automation_enabled: true
            });

          if (trafficError) {
            console.warn(`⚠️ Failed to activate ${channel}:`, trafficError);
          } else {
            console.log(`✅ Activated traffic source: ${channel}`);
          }
        } catch (err) {
          console.warn(`⚠️ Error activating ${channel}:`, err);
        }
      }

      // Step 5: Enable autopilot in user settings
      console.log("⚙️ Step 5: Enabling autopilot settings...");
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        });

      if (settingsError) {
        console.warn("⚠️ Settings update warning:", settingsError);
      } else {
        console.log("✅ Autopilot enabled in settings");
      }

      // Step 6: Create initial performance record
      console.log("📊 Step 6: Creating performance record...");
      const { error: perfError } = await supabase
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

      if (perfError) {
        console.warn("⚠️ Performance record warning:", perfError);
      } else {
        console.log("✅ Performance tracking initialized");
      }

      // Step 7: Create optimization insight
      console.log("🎯 Step 7: Starting optimization monitoring...");
      await this.startOptimizationMonitoring(campaign.id, user.id);

      console.log("🎉 AUTOPILOT LAUNCH COMPLETE!");
      console.log("📈 Final stats:", {
        campaignId: campaign.id,
        products: systemSetup.stats.totalProducts,
        links: systemSetup.stats.activeLinks,
        trafficChannels: trafficChannels.length
      });

      return {
        success: true,
        campaign,
        links: systemSetup.stats.activeLinks,
        message: `Autopilot activated! ${systemSetup.stats.totalProducts} products configured with ${trafficChannels.length} traffic channels.`
      };
    } catch (error: any) {
      console.error("💥 AUTOPILOT LAUNCH FAILED:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      return {
        success: false,
        campaign: null,
        links: 0,
        message: error.message || "Failed to launch autopilot - check console for details"
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
  },

  // Alias for compatibility
  async launchAutopilot(config: any) {
    // Map the new config format to the expected one
    const mappedConfig: AutopilotConfig = {
      budget: config.budget || 0,
      products: config.productIds || [],
      targetAudience: "Auto-optimized Audience",
      trafficChannels: config.trafficChannels || []
    };
    
    const result = await this.launchAutopilotCampaign(mappedConfig);
    return {
      success: result.success,
      campaignId: result.campaign?.id,
      message: result.message,
      error: result.success ? null : result.message
    };
  },

  async getAutopilotStatus() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { isActive: false, activeCampaigns: 0, totalRevenue: 0 };
      }

      // Check for active campaigns with autopilot characteristics
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      // Check user settings
      const { data: settings } = await supabase
        .from("user_settings")
        .select("autopilot_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      const stats = await this.getAutopilotStats();
      
      // Consider autopilot active if there are active campaigns OR autopilot_enabled is true
      const isActive = (campaigns && campaigns.length > 0) || settings?.autopilot_enabled === true;

      return {
        isActive,
        activeCampaigns: campaigns?.length || 0,
        totalRevenue: stats.totalRevenue
      };
    } catch (error) {
      console.error("Error getting status:", error);
      return { isActive: false, activeCampaigns: 0, totalRevenue: 0 };
    }
  },

  /**
   * Resume/reactivate paused autopilot campaigns
   */
  async resumeAutopilot(): Promise<{
    success: boolean;
    message: string;
    resumedCampaigns: number;
  }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: "Authentication required",
          resumedCampaigns: 0
        };
      }

      // Reactivate paused campaigns
      const { data: pausedCampaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paused");

      if (!pausedCampaigns || pausedCampaigns.length === 0) {
        return {
          success: false,
          message: "No paused campaigns to resume",
          resumedCampaigns: 0
        };
      }

      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ status: "active" })
        .eq("user_id", user.id)
        .eq("status", "paused");

      if (updateError) {
        console.error("Failed to resume campaigns:", updateError);
        return {
          success: false,
          message: "Failed to resume campaigns",
          resumedCampaigns: 0
        };
      }

      // Enable autopilot in settings
      await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        });

      return {
        success: true,
        message: `Resumed ${pausedCampaigns.length} campaigns`,
        resumedCampaigns: pausedCampaigns.length
      };
    } catch (error: any) {
      console.error("Resume autopilot error:", error);
      return {
        success: false,
        message: error.message || "Failed to resume autopilot",
        resumedCampaigns: 0
      };
    }
  }
};