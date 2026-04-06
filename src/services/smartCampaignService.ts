import { supabase } from "@/integrations/supabase/client";
import { automationScheduler } from "./automationScheduler";
import { trafficAutomationService } from "./trafficAutomationService";
import { affiliateLinkService } from "./affiliateLinkService";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];

export interface CampaignConfig {
  name: string;
  goal?: string;
  budget: number;
  productUrls?: string[];
  autoStart?: boolean;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  setup_time: string;
  estimated_roi: string;
  goal?: string;
  suggestedBudget?: number;
  suggestedDuration?: string;
}

const MOCK_TEMPLATES: CampaignTemplate[] = [
  {
    id: "ecom-1",
    name: "E-commerce Sales Engine",
    description: "Optimized for physical product sales with multi-channel retargeting.",
    tags: ["e-commerce", "physical products", "high-volume"],
    setup_time: "5 min",
    estimated_roi: "150-300%"
  },
  {
    id: "saas-1",
    name: "SaaS Trial Driver",
    description: "Designed to maximize software signups and free trial conversions.",
    tags: ["software", "B2B", "subscriptions"],
    setup_time: "10 min",
    estimated_roi: "200-400%"
  },
  {
    id: "info-1",
    name: "Course & Info Product",
    description: "Content-heavy funnel for digital products and education.",
    tags: ["digital", "education", "courses"],
    setup_time: "8 min",
    estimated_roi: "300-500%"
  }
];

export interface CampaignStats {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  activeTasks: number;
  contentReady: number;
  trafficSources: number;
}

export const smartCampaignService = {
  /**
   * Get available campaign templates
   */
  getTemplates(): CampaignTemplate[] {
    return MOCK_TEMPLATES;
  },

  /**
   * Get specific campaign template
   */
  getTemplate(id: string): CampaignTemplate | null {
    return MOCK_TEMPLATES.find(t => t.id === id) || null;
  },

  /**
   * Create quick campaign (alias for smart campaign with default routing)
   */
  async createQuickCampaign(config: CampaignConfig): Promise<{
    success: boolean;
    campaign: Campaign | null;
    error: string | null;
  }> {
    // A quick campaign sets autoStart to true by default for maximum velocity
    return this.createSmartCampaign({
      ...config,
      autoStart: config.autoStart !== undefined ? config.autoStart : true
    });
  },

  /**
   * Create smart campaign with autopilot
   */
  async createSmartCampaign(config: CampaignConfig): Promise<{
    success: boolean;
    campaign: Campaign | null;
    error: string | null;
  }> {
    try {
      console.log("🚀 Creating smart campaign:", config.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, campaign: null, error: "Not authenticated" };
      }

      // Create campaign
      const insert: any = {
        user_id: user.id,
        name: config.name,
        goal: config.goal || "Generate revenue",
        budget: config.budget,
        is_autopilot: true,
        status: "active"
      };

      const { data: campaign, error: campaignError } = await (supabase as any).from("campaigns")
        .insert(insert)
        .select()
        .single();

      if (campaignError || !campaign) {
        console.error("❌ Campaign creation failed:", campaignError);
        return { success: false, campaign: null, error: campaignError?.message || "Creation failed" };
      }

      console.log("✅ Campaign created:", campaign.id);

      // Create affiliate links if provided
      if (config.productUrls && config.productUrls.length > 0) {
        console.log("📎 Creating affiliate links...");
        
        for (const url of config.productUrls) {
          await affiliateLinkService.createLink({
            originalUrl: url,
            productName: this.extractProductName(url),
            campaignId: campaign.id,
            network: "Direct"
          });
        }
      }

      // Initialize automation
      console.log("🤖 Initializing automation...");
      
      // Create tasks
      const tasksCreated = await automationScheduler.createDefaultTasks(campaign.id);
      console.log(`Tasks created: ${tasksCreated}`);

      // Launch traffic
      const trafficResult = await trafficAutomationService.launchAutomatedTraffic({
        campaignId: campaign.id,
        budget: config.budget,
        autoActivate: config.autoStart || false
      });
      console.log(`Traffic sources created: ${trafficResult.sources.length}`);

      // Initialize metrics
      await (supabase as any).from("automation_metrics")
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          metric_date: new Date().toISOString().split("T")[0],
          tasks_executed: 0,
          tasks_successful: 0,
          tasks_failed: 0,
          content_generated: 0,
          content_posted: 0,
          traffic_generated: 0,
          clicks_generated: 0,
          conversions_generated: 0,
          revenue_generated: 0,
          optimization_actions: 0,
          ai_decisions_made: 0
        });

      // Start scheduler if autoStart
      if (config.autoStart && !automationScheduler.isRunning) {
        console.log("▶️ Starting automation scheduler...");
        await automationScheduler.start();
      }

      console.log("✅ Smart campaign fully initialized");

      return { success: true, campaign, error: null };
    } catch (err) {
      console.error("💥 Campaign creation failed:", err);
      return { success: false, campaign: null, error: "Creation failed" };
    }
  },

  /**
   * Get campaign with full stats
   */
  async getCampaign(campaignId: string): Promise<{
    campaign: Campaign | null;
    stats: CampaignStats;
    error: string | null;
  }> {
    try {
      const { data: campaign, error: campaignError } = await (supabase as any).from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaign) {
        return {
          campaign: null,
          stats: {
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            activeTasks: 0,
            contentReady: 0,
            trafficSources: 0
          },
          error: campaignError?.message || "Not found"
        };
      }

      // Get stats
      const [linksResult, tasksResult, trafficResult] = await Promise.all([
        (supabase as any).from("affiliate_links").select("clicks, conversions, revenue").eq("campaign_id", campaignId),
        (supabase as any).from("autopilot_tasks").select("id", { count: "exact" }).eq("campaign_id", campaignId).eq("status", "pending"),
        (supabase as any).from("traffic_sources").select("id", { count: "exact" }).eq("campaign_id", campaignId).eq("status", "active")
      ]);

      const links = linksResult.data || [];
      const stats: CampaignStats = {
        totalClicks: links.reduce((sum, l) => sum + (l.clicks || 0), 0),
        totalConversions: links.reduce((sum, l) => sum + (l.conversions || 0), 0),
        totalRevenue: links.reduce((sum, l) => sum + Number(l.revenue || 0), 0),
        activeTasks: tasksResult.count || 0,
        contentReady: 0,
        trafficSources: trafficResult.count || 0
      };

      // Remove content_queue check, use activity_logs count instead
      const { count: activityCount } = await supabase
        .from("activity_logs")
        .select("id", { count: "exact" })
        .eq("metadata->>campaign_id", campaignId)
        .eq("action", "content_generated");

      stats.contentReady = activityCount || 0;

      return { campaign, stats, error: null };
    } catch (err) {
      return {
        campaign: null,
        stats: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          activeTasks: 0,
          contentReady: 0,
          trafficSources: 0
        },
        error: "Failed to fetch campaign"
      };
    }
  },

  /**
   * Get all campaigns for user
   */
  async getUserCampaigns(): Promise<{
    campaigns: Campaign[];
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { campaigns: [], error: "Not authenticated" };
      }

      const { data, error } = await (supabase as any).from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return { campaigns: [], error: error.message };
      }

      return { campaigns: data || [], error: null };
    } catch (err) {
      return { campaigns: [], error: "Failed to fetch campaigns" };
    }
  },

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<CampaignInsert>): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await (supabase as any).from("campaigns")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Update failed" };
    }
  },

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await (supabase as any).from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Delete failed" };
    }
  },

  /**
   * Toggle autopilot
   */
  async toggleAutopilot(campaignId: string, enable: boolean): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await (supabase as any).from("campaigns")
        .update({
          is_autopilot: enable,
          updated_at: new Date().toISOString()
        })
        .eq("id", campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (enable) {
        await automationScheduler.createDefaultTasks(campaignId);
        if (!automationScheduler.isRunning) {
          await automationScheduler.start();
        }
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Toggle failed" };
    }
  },

  /**
   * Extract product name from URL
   */
  extractProductName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || "";
      return lastPart
        .replace(/-/g, " ")
        .replace(/\.[^/.]+$/, "")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } catch {
      return "Product";
    }
  }
};