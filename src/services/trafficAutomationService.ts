import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TrafficSource = Database["public"]["Tables"]["traffic_sources"]["Row"];
type TrafficSourceInsert = Database["public"]["Tables"]["traffic_sources"]["Insert"];

export interface TrafficAllocation {
  source: string;
  allocation: number;
  expectedClicks: number;
  cost: number;
}

export interface TrafficConfig {
  source_name: string;
  source_type: "paid_search" | "paid_social" | "email" | "organic" | "video";
  base_cpc: number;
  min_daily_budget: number;
}

export const trafficAutomationService = {
  // Valid traffic sources matching database constraints
  TRAFFIC_SOURCES: [
    {
      source_name: "Google Search",
      source_type: "paid_search" as const,
      base_cpc: 0.85,
      min_daily_budget: 10
    },
    {
      source_name: "Facebook Ads",
      source_type: "paid_social" as const,
      base_cpc: 0.65,
      min_daily_budget: 5
    },
    {
      source_name: "Instagram Ads",
      source_type: "paid_social" as const,
      base_cpc: 0.55,
      min_daily_budget: 5
    },
    {
      source_name: "TikTok Ads",
      source_type: "paid_social" as const,
      base_cpc: 0.45,
      min_daily_budget: 20
    },
    {
      source_name: "LinkedIn Ads",
      source_type: "paid_social" as const,
      base_cpc: 1.25,
      min_daily_budget: 10
    },
    {
      source_name: "Twitter/X Ads",
      source_type: "paid_social" as const,
      base_cpc: 0.75,
      min_daily_budget: 5
    },
    {
      source_name: "Pinterest Ads",
      source_type: "paid_social" as const,
      base_cpc: 0.50,
      min_daily_budget: 5
    },
    {
      source_name: "YouTube Ads",
      source_type: "video" as const,
      base_cpc: 0.30,
      min_daily_budget: 10
    },
    {
      source_name: "Email Marketing",
      source_type: "email" as const,
      base_cpc: 0.15,
      min_daily_budget: 2
    }
  ] as TrafficConfig[],

  /**
   * Launch automated traffic campaign
   */
  async launchAutomatedTraffic(config: {
    campaignId: string;
    budget: number;
    sources?: string[];
    autoActivate?: boolean;
  }): Promise<{ 
    success: boolean; 
    sources: TrafficSource[]; 
    activationInstructions?: string;
    error: string | null;
  }> {
    try {
      console.log("🚦 Launching traffic for:", config.campaignId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, sources: [], error: "Not authenticated" };
      }

      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id, name, budget")
        .eq("id", config.campaignId)
        .single();

      if (!campaign) {
        return { success: false, sources: [], error: "Campaign not found" };
      }

      let sourcesToCreate: TrafficConfig[];
      if (config.sources && config.sources.length > 0) {
        sourcesToCreate = this.TRAFFIC_SOURCES.filter(s => 
          config.sources!.includes(s.source_name)
        );
      } else {
        sourcesToCreate = this.selectOptimalSources(config.budget);
      }

      if (sourcesToCreate.length === 0) {
        return { success: false, sources: [], error: "No valid sources" };
      }

      const budgetPerSource = config.budget / sourcesToCreate.length;

      const inserts: TrafficSourceInsert[] = sourcesToCreate.map(src => ({
        campaign_id: config.campaignId,
        source_name: src.source_name,
        source_type: src.source_type,
        status: config.autoActivate ? "active" : "pending",
        daily_budget: Math.max(budgetPerSource, src.min_daily_budget),
        total_spent: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_revenue: 0,
        cpc: src.base_cpc,
        ctr: 0,
        conversion_rate: 0,
        automation_enabled: config.autoActivate || false
      }));

      const { data, error } = await supabase
        .from("traffic_sources")
        .insert(inserts)
        .select();

      if (error) {
        console.error("❌ Error:", error);
        return { success: false, sources: [], error: error.message };
      }

      const instructions = config.autoActivate 
        ? "Traffic sources active and ready."
        : "Sources created. Activate in Campaign Monitor.";

      return { 
        success: true, 
        sources: data || [], 
        activationInstructions: instructions,
        error: null 
      };
    } catch (err) {
      console.error("💥 Launch error:", err);
      return { 
        success: false, 
        sources: [], 
        error: err instanceof Error ? err.message : "Launch failed" 
      };
    }
  },

  /**
   * Select optimal sources based on budget
   */
  selectOptimalSources(budget: number): TrafficConfig[] {
    const sources: TrafficConfig[] = [];
    
    if (budget >= 50) {
      sources.push(
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Google Search")!,
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Facebook Ads")!,
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Instagram Ads")!,
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Email Marketing")!
      );
    } else if (budget >= 25) {
      sources.push(
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Facebook Ads")!,
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Instagram Ads")!,
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Email Marketing")!
      );
    } else {
      sources.push(
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Email Marketing")!,
        this.TRAFFIC_SOURCES.find(s => s.source_name === "Instagram Ads")!
      );
    }

    return sources.filter(Boolean);
  },

  /**
   * Get traffic sources for campaign
   */
  async getTrafficSources(campaignId: string): Promise<{
    sources: TrafficSource[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("traffic_sources")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("total_revenue", { ascending: false });

      if (error) {
        return { sources: [], error: error.message };
      }

      return { sources: data || [], error: null };
    } catch (err) {
      return { sources: [], error: "Fetch failed" };
    }
  },

  /**
   * Update traffic metrics
   */
  async updateTrafficMetrics(sourceId: string, metrics: {
    clicks?: number;
    conversions?: number;
    revenue?: number;
    spent?: number;
  }): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: source } = await supabase
        .from("traffic_sources")
        .select("*")
        .eq("id", sourceId)
        .single();

      if (!source) {
        return { success: false, error: "Source not found" };
      }

      const updates = {
        total_clicks: (source.total_clicks || 0) + (metrics.clicks || 0),
        total_conversions: (source.total_conversions || 0) + (metrics.conversions || 0),
        total_revenue: (source.total_revenue || 0) + (metrics.revenue || 0),
        total_spent: (source.total_spent || 0) + (metrics.spent || 0)
      };

      const ctr = updates.total_clicks > 0 
        ? (updates.total_clicks / Math.max(updates.total_clicks * 20, 1)) * 100 
        : 0;
      const conversion_rate = updates.total_clicks > 0 
        ? (updates.total_conversions / updates.total_clicks) * 100 
        : 0;
      const actual_cpc = updates.total_clicks > 0 
        ? updates.total_spent / updates.total_clicks 
        : source.cpc || 0;

      const { error } = await supabase
        .from("traffic_sources")
        .update({
          ...updates,
          ctr,
          conversion_rate,
          cpc: actual_cpc
        })
        .eq("id", sourceId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Update failed" };
    }
  },

  /**
   * Get traffic status
   */
  async getTrafficStatus(campaignId?: string): Promise<{
    activeChannels: number;
    totalTraffic: number;
    optimizationStatus: string;
    nextOptimization: string;
  }> {
    try {
      let query = supabase
        .from("traffic_sources")
        .select("*", { count: "exact" });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data, count, error } = await query.eq("status", "active");

      if (error) {
        return {
          activeChannels: 0,
          totalTraffic: 0,
          optimizationStatus: "inactive",
          nextOptimization: "N/A"
        };
      }

      const totalClicks = (data || []).reduce((sum, s) => sum + (s.total_clicks || 0), 0);

      return {
        activeChannels: count || 0,
        totalTraffic: totalClicks,
        optimizationStatus: count && count > 0 ? "active" : "inactive",
        nextOptimization: "15 min"
      };
    } catch (err) {
      return {
        activeChannels: 0,
        totalTraffic: 0,
        optimizationStatus: "inactive",
        nextOptimization: "N/A"
      };
    }
  }
};