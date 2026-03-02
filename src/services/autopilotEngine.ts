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

    try {
      // Step 1: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required to launch autopilot");
      }
      console.log("✅ User authenticated:", user.email);

      // Step 2: Create main autopilot campaign with REQUIRED goal field
      const campaignName = config.campaignName || `Autopilot Campaign ${new Date().toLocaleDateString()}`;
      console.log("📝 Creating campaign:", campaignName);

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: campaignName,
          goal: "sales",  // REQUIRED field - use sales as default
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

      // Step 3: Activate traffic sources (using correct column names from schema)
      const channels = config.trafficChannels || ["organic", "social", "email", "paid"];
      console.log("🌐 Activating traffic channels:", channels);

      for (const channel of channels) {
        try {
          const { error: sourceError } = await supabase
            .from("traffic_sources")
            .insert({
              campaign_id: campaign.id,
              source_type: channel,
              source_name: channel.charAt(0).toUpperCase() + channel.slice(1),
              status: "active",
              total_clicks: 0,
              total_conversions: 0,
              total_revenue: 0
            });

          if (sourceError) {
            console.warn(`⚠️ Failed to activate ${channel}:`, sourceError);
          } else {
            console.log(`✅ Activated: ${channel}`);
          }
        } catch (err) {
          console.warn(`⚠️ Exception activating ${channel}:`, err);
        }
      }

      // Step 4: Enable autopilot in user settings
      console.log("⚙️ Updating user settings...");

      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            autopilot_enabled: true,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "user_id"
          }
        );

      if (settingsError) {
        console.error("❌ Settings update failed:", settingsError);
        throw new Error(`Failed to update settings: ${settingsError.message}`);
      }

      console.log("✅ Autopilot enabled in settings");

      // Step 5: Verify the settings were saved
      const { data: verifySettings, error: verifyError } = await supabase
        .from("user_settings")
        .select("autopilot_enabled")
        .eq("user_id", user.id)
        .single();

      if (verifyError) {
        console.warn("⚠️ Could not verify settings:", verifyError);
      } else {
        console.log("✅ Settings verified:", verifySettings);
      }

      return {
        success: true,
        message: "Autopilot system launched successfully",
        campaignId: campaign.id,
        activeChannels: channels.length
      };
    } catch (error: any) {
      console.error("❌ Autopilot launch failed:", error);

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

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      console.log("👤 User:", user.id);

      // Step 1: Pause all active autopilot campaigns
      console.log("⏸️ Pausing campaigns...");
      const { data: pausedCampaigns, error: campaignError } = await supabase
        .from("campaigns")
        .update({ status: "paused" })
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "active")
        .select();

      if (campaignError) {
        console.error("❌ Failed to pause campaigns:", campaignError);
        throw new Error(campaignError.message);
      }

      console.log(`✅ Paused ${pausedCampaigns?.length || 0} campaigns`);

      // Step 2: Disable autopilot in settings
      console.log("⚙️ Updating user settings...");
      const { error: settingsError } = await supabase
        .from("user_settings")
        .update({
          autopilot_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (settingsError) {
        console.error("❌ Failed to update settings:", settingsError);
        throw new Error(settingsError.message);
      }

      console.log("✅ Settings updated");

      // Step 3: Verify the settings were saved
      const { data: verifySettings, error: verifyError } = await supabase
        .from("user_settings")
        .select("autopilot_enabled")
        .eq("user_id", user.id)
        .single();

      if (verifyError) {
        console.warn("⚠️ Could not verify settings:", verifyError);
      } else {
        console.log("✅ Settings verified:", verifySettings);
      }

      return {
        success: true,
        message: "Autopilot stopped successfully",
        pausedCount: pausedCampaigns?.length || 0
      };
    } catch (error: any) {
      console.error("❌ Stop autopilot failed:", error);

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

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      console.log("👤 User:", user.id);

      // Step 1: Reactivate paused autopilot campaigns
      console.log("▶️ Reactivating campaigns...");
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

      // Step 2: Enable autopilot in settings
      console.log("⚙️ Updating user settings...");
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            autopilot_enabled: true,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "user_id"
          }
        );

      if (settingsError) {
        console.error("❌ Failed to update settings:", settingsError);
        throw new Error(settingsError.message);
      }

      console.log("✅ Settings updated");

      // Step 3: Verify the settings were saved
      const { data: verifySettings, error: verifyError } = await supabase
        .from("user_settings")
        .select("autopilot_enabled")
        .eq("user_id", user.id)
        .single();

      if (verifyError) {
        console.warn("⚠️ Could not verify settings:", verifyError);
      } else {
        console.log("✅ Settings verified:", verifySettings);
      }

      return {
        success: true,
        message: `Resumed ${resumedCount} autopilot campaigns`,
        resumedCount
      };
    } catch (error: any) {
      console.error("❌ Resume autopilot failed:", error);

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