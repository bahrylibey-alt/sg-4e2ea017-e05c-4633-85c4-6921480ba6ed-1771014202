import { supabase } from "@/integrations/supabase/client";
import { automationScheduler } from "./automationScheduler";
import { freeTrafficEngine } from "./freeTrafficEngine";

export interface AutopilotConfig {
  campaignName?: string;
  budget?: number;
  trafficChannels?: string[];
  enableFreeTraffic?: boolean;
}

export const autopilotEngine = {
  /**
   * Launch autopilot system with REAL automation
   */
  async launchAutopilot(config: AutopilotConfig = {}) {
    console.log("🚀 Starting REAL autopilot launch...");

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

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: campaignName,
          goal: "sales",
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

      // Wait for database commit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Create automation tasks
      console.log("⚙️ Setting up automation tasks...");
      
      const tasksCreated = await automationScheduler.createDefaultTasks(campaign.id);
      
      if (!tasksCreated) {
        console.warn("⚠️ Failed to create automation tasks");
      } else {
        console.log("✅ Automation tasks scheduled");
      }

      // Step 4: Activate FREE traffic sources
      console.log("🌐 Activating FREE traffic sources...");
      
      const freeTrafficResult = await freeTrafficEngine.activateFreeTraffic(
        campaign.id,
        config.trafficChannels,
        campaign
      );

      if (!freeTrafficResult.success) {
        console.warn("⚠️ Free traffic activation warning:", freeTrafficResult.error);
      } else {
        console.log(`✅ Activated ${freeTrafficResult.activated} free traffic sources`);
      }

      // Step 5: Enable autopilot in user settings
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
      } else {
        console.log("✅ Autopilot enabled in settings");
      }

      // Step 6: START THE AUTOMATION SCHEDULER
      console.log("🚀 Starting automation scheduler...");
      await automationScheduler.start();

      console.log("✅ Autopilot system LIVE and running");

      return {
        success: true,
        message: "Autopilot system launched and RUNNING",
        campaignId: campaign.id,
        campaignName: campaign.name,
        activeChannels: freeTrafficResult.activated || 0,
        estimatedReach: freeTrafficResult.estimatedReach || 0,
        automationStatus: "active"
      };
    } catch (error: any) {
      console.error("❌ Autopilot launch failed:", error);

      return {
        success: false,
        message: error.message || "Failed to launch autopilot",
        automationStatus: "failed"
      };
    }
  },

  /**
   * Stop autopilot system
   */
  async stopAutopilot() {
    console.log("⏸️ Stopping autopilot...");

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Stop the scheduler
      automationScheduler.stop();
      console.log("✅ Scheduler stopped");

      // Pause all active autopilot campaigns
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
        throw new Error(settingsError.message);
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

      // Restart the scheduler
      await automationScheduler.start();
      console.log("✅ Scheduler restarted");

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
   * Get REAL autopilot status
   */
  async getAutopilotStatus() {
    console.log("📊 Checking autopilot status...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("❌ No user logged in");
        return {
          isActive: false,
          activeCampaigns: 0,
          totalLinks: 0,
          totalClicks: 0,
          totalRevenue: 0,
          settings: null,
          schedulerRunning: false
        };
      }

      // Check user settings
      const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Check active autopilot campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "active");

      // Get REAL metrics from automation_metrics table
      const { data: metrics } = await supabase
        .from("automation_metrics")
        .select("*")
        .in("campaign_id", campaigns?.map(c => c.id) || [])
        .order("metric_date", { ascending: false })
        .limit(30);

      const totalClicks = metrics?.reduce((sum, m) => sum + (m.clicks_generated || 0), 0) || 0;
      const totalConversions = metrics?.reduce((sum, m) => sum + (m.conversions_generated || 0), 0) || 0;
      const totalRevenue = metrics?.reduce((sum, m) => sum + (Number(m.revenue_generated) || 0), 0) || 0;

      // Check if scheduler is running
      const schedulerRunning = automationScheduler.isRunning;

      const isActive = (settings?.autopilot_enabled === true) && 
                       ((campaigns?.length || 0) > 0) && 
                       schedulerRunning;

      return {
        isActive,
        activeCampaigns: campaigns?.length || 0,
        totalLinks: campaigns?.length || 0,
        totalClicks,
        totalRevenue,
        totalConversions,
        settings,
        schedulerRunning
      };
    } catch (error: any) {
      console.error("💥 Error getting autopilot status:", error);
      return {
        isActive: false,
        activeCampaigns: 0,
        totalLinks: 0,
        totalClicks: 0,
        totalRevenue: 0,
        totalConversions: 0,
        settings: null,
        schedulerRunning: false
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

      // Get active campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, status, is_autopilot")
        .eq("user_id", user.id)
        .eq("is_autopilot", true);

      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const campaignIds = campaigns?.map(c => c.id) || [];

      // Get REAL metrics
      const { data: metrics } = await supabase
        .from("automation_metrics")
        .select("*")
        .in("campaign_id", campaignIds)
        .order("metric_date", { ascending: false })
        .limit(30);

      const totalClicks = metrics?.reduce((sum, m) => sum + (m.clicks_generated || 0), 0) || 0;
      const totalConversions = metrics?.reduce((sum, m) => sum + (m.conversions_generated || 0), 0) || 0;
      const totalRevenue = metrics?.reduce((sum, m) => sum + (Number(m.revenue_generated) || 0), 0) || 0;

      // Get active traffic sources count
      const { data: trafficSources } = await supabase
        .from("traffic_sources")
        .select("id")
        .in("campaign_id", campaignIds)
        .eq("status", "active");

      return {
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCommissions: totalRevenue * 0.4,
        activeCampaigns,
        activeLinks: campaigns?.length || 0,
        trafficSources: trafficSources?.length || 0,
        schedulerStatus: automationScheduler.isRunning ? "running" : "stopped"
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
        trafficSources: 0,
        schedulerStatus: "stopped"
      };
    }
  }
};