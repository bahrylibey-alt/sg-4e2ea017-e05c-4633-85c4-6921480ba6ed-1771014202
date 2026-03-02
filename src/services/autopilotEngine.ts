import { supabase } from "@/integrations/supabase/client";
import { activityLogger } from "./activityLogger";

export interface AutopilotConfig {
  campaignName?: string;
  budget?: number;
  trafficChannels?: string[];
}

export const autopilotEngine = {
  /**
   * Launch autopilot system with complete automation
   */
  async launchAutopilot(config: AutopilotConfig = {}) {
    console.log("🚀 Starting autopilot launch...");
    await activityLogger.log("autopilot", "started", "Initializing autopilot system");

    try {
      // Step 1: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required to launch autopilot");
      }
      console.log("✅ User authenticated:", user.email);

      // Step 2: Create main autopilot campaign
      const campaignName = config.campaignName || `Autopilot Campaign ${new Date().toLocaleDateString()}`;
      console.log("📝 Creating campaign:", campaignName);
      
      await activityLogger.log("autopilot", "info", `Creating campaign: ${campaignName}`);

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: campaignName,
          goal: "sales",  // Required field - default to sales
          status: "active",
          budget: config.budget || 1000,
          daily_budget: 0,
          type: "autopilot",
          is_autopilot: true
        })
        .select()
        .single();

      if (campaignError || !campaign) {
        console.error("❌ Campaign creation failed:", campaignError);
        throw new Error(campaignError?.message || "Failed to create campaign");
      }

      console.log("✅ Campaign created:", campaign.id);
      await activityLogger.log("autopilot", "success", `Campaign created: ${campaign.name}`);

      // Step 3: Activate traffic sources (using correct column names)
      const channels = config.trafficChannels || ["organic", "social", "email", "paid"];
      console.log("🌐 Activating traffic channels:", channels);
      
      await activityLogger.log("autopilot", "info", `Activating ${channels.length} traffic channels`);

      for (const channel of channels) {
        try {
          await supabase.from("traffic_sources").insert({
            campaign_id: campaign.id,
            source_type: channel,
            source_name: channel.charAt(0).toUpperCase() + channel.slice(1),
            status: "active",
            total_clicks: 0,
            total_conversions: 0,
            total_revenue: 0,
            automation_enabled: true
          });
          console.log(`✅ Activated: ${channel}`);
        } catch (err) {
          console.warn(`⚠️ Failed to activate ${channel}:`, err);
        }
      }

      await activityLogger.log("autopilot", "success", `Traffic channels activated: ${channels.join(", ")}`);

      // Step 4: Enable autopilot in user settings
      console.log("⚙️ Updating user settings...");
      
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) {
        console.warn("⚠️ Settings update warning:", settingsError);
      } else {
        console.log("✅ Autopilot enabled in settings");
      }

      await activityLogger.log("autopilot", "success", "Autopilot system activated successfully");

      return {
        success: true,
        message: "Autopilot system launched successfully",
        campaignId: campaign.id,
        activeChannels: channels.length
      };

    } catch (error: any) {
      console.error("❌ Autopilot launch failed:", error);
      await activityLogger.log("autopilot", "error", error.message || "Launch failed");
      
      return {
        success: false,
        message: error.message || "Failed to launch autopilot"
      };
    }
  },

  /**
   * Stop/pause autopilot system
   */
  async stopAutopilot() {
    console.log("⏸️ Stopping autopilot...");
    await activityLogger.log("autopilot", "info", "Stopping autopilot system");

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Pause all active autopilot campaigns
      const { error: campaignError } = await supabase
        .from("campaigns")
        .update({ status: "paused" })
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "active");

      if (campaignError) {
        console.error("❌ Failed to pause campaigns:", campaignError);
      } else {
        console.log("✅ Autopilot campaigns paused");
      }

      // Disable autopilot in settings
      const { error: settingsError } = await supabase
        .from("user_settings")
        .update({ 
          autopilot_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (settingsError) {
        console.error("❌ Failed to update settings:", settingsError);
      } else {
        console.log("✅ Autopilot disabled in settings");
      }

      await activityLogger.log("autopilot", "success", "Autopilot system stopped");

      return {
        success: true,
        message: "Autopilot stopped successfully"
      };

    } catch (error: any) {
      console.error("❌ Stop autopilot failed:", error);
      await activityLogger.log("autopilot", "error", error.message || "Stop failed");
      
      return {
        success: false,
        message: error.message || "Failed to stop autopilot"
      };
    }
  },

  /**
   * Resume paused autopilot campaigns
   */
  async resumeAutopilot() {
    console.log("▶️ Resuming autopilot...");
    await activityLogger.log("autopilot", "info", "Resuming autopilot system");

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Reactivate paused autopilot campaigns
      const { data: campaigns, error: campaignError } = await supabase
        .from("campaigns")
        .update({ status: "active" })
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "paused")
        .select();

      if (campaignError) {
        console.error("❌ Failed to resume campaigns:", campaignError);
        throw new Error(campaignError.message);
      }

      const resumedCount = campaigns?.length || 0;
      console.log(`✅ Resumed ${resumedCount} campaigns`);

      // Enable autopilot in settings
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) {
        console.warn("⚠️ Settings update warning:", settingsError);
      } else {
        console.log("✅ Autopilot enabled in settings");
      }

      await activityLogger.log("autopilot", "success", `Resumed ${resumedCount} campaigns`);

      return {
        success: true,
        message: `Resumed ${resumedCount} autopilot campaigns`,
        resumedCount
      };

    } catch (error: any) {
      console.error("❌ Resume autopilot failed:", error);
      await activityLogger.log("autopilot", "error", error.message || "Resume failed");
      
      return {
        success: false,
        message: error.message || "Failed to resume autopilot"
      };
    }
  },

  /**
   * Get autopilot status
   */
  async getAutopilotStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          isActive: false,
          hasActiveCampaigns: false,
          hasPausedCampaigns: false
        };
      }

      // Check for active campaigns
      const { data: activeCampaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "active");

      // Check for paused campaigns
      const { data: pausedCampaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "paused");

      // Check settings
      const { data: settings } = await supabase
        .from("user_settings")
        .select("autopilot_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      const hasActive = (activeCampaigns?.length || 0) > 0;
      const hasPaused = (pausedCampaigns?.length || 0) > 0;
      const settingsEnabled = settings?.autopilot_enabled || false;

      return {
        isActive: hasActive && settingsEnabled,
        hasActiveCampaigns: hasActive,
        hasPausedCampaigns: hasPaused,
        settingsEnabled
      };

    } catch (error) {
      console.error("Failed to get autopilot status:", error);
      return {
        isActive: false,
        hasActiveCampaigns: false,
        hasPausedCampaigns: false
      };
    }
  },

  /**
   * Get comprehensive autopilot stats
   */
  async getAutopilotStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get stats from campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, status, is_autopilot")
        .eq("user_id", user.id)
        .eq("is_autopilot", true);

      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const campaignIds = campaigns?.map(c => c.id) || [];

      // Get stats from traffic_sources (using correct column names)
      let sources: any[] = [];
      
      if (campaignIds.length > 0) {
        const { data } = await supabase
          .from("traffic_sources")
          .select("total_clicks, total_conversions, total_revenue, source_name, campaign_id")
          .in("campaign_id", campaignIds);
          
        sources = data || [];
      }

      // Calculate totals
      const totalClicks = sources?.reduce((sum, s) => sum + (s.total_clicks || 0), 0) || 0;
      const totalConversions = sources?.reduce((sum, s) => sum + (s.total_conversions || 0), 0) || 0;
      const totalRevenue = sources?.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 0;
      
      // Get affiliate links count
      const { count: activeLinks } = await supabase
        .from("affiliate_links")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      return {
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCommissions: totalRevenue * 0.4, // Estimated 40% commission
        activeCampaigns,
        activeLinks: activeLinks || 0,
        trafficSources: sources?.length || 0
      };
    } catch (error) {
      console.error("Error fetching autopilot stats:", error);
      return {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommissions: 0,
        activeCampaigns: 0,
        activeLinks: 0,
        trafficSources: 0
      };
    }
  }
};