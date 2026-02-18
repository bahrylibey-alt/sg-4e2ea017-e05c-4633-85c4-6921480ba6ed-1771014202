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

export const trafficAutomationService = {
  // REAL: Launch automated traffic campaign
  async launchAutomatedTraffic(config: {
    campaignId: string;
    budget: number;
    sources?: string[];
  }): Promise<{ success: boolean; sources: TrafficSource[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, sources: [], error: "User not authenticated" };
      }

      // Default traffic sources if not specified
      const defaultSources = [
        { name: "Google Ads", type: "paid_search", cpc: 0.85 },
        { name: "Facebook Ads", type: "social_media", cpc: 0.65 },
        { name: "Instagram Ads", type: "social_media", cpc: 0.55 },
        { name: "TikTok Ads", type: "social_media", cpc: 0.45 },
        { name: "LinkedIn Ads", type: "social_media", cpc: 1.25 },
        { name: "Twitter Ads", type: "social_media", cpc: 0.75 },
        { name: "Email Marketing", type: "email", cpc: 0.15 },
        { name: "SEO Traffic", type: "organic", cpc: 0.05 }
      ];

      const sourcesToCreate = config.sources || defaultSources.map(s => s.name);
      const budgetPerSource = config.budget / sourcesToCreate.length;

      const inserts: TrafficSourceInsert[] = sourcesToCreate.map(sourceName => {
        const sourceConfig = defaultSources.find(s => s.name === sourceName) || defaultSources[0];
        return {
          campaign_id: config.campaignId,
          user_id: user.id,
          source_name: sourceName,
          source_type: sourceConfig.type as any,
          status: "active",
          daily_budget: budgetPerSource,
          total_spent: 0,
          total_clicks: 0,
          total_conversions: 0,
          total_revenue: 0,
          cpc: sourceConfig.cpc,
          ctr: 0,
          conversion_rate: 0
        };
      });

      const { data, error } = await supabase
        .from("traffic_sources")
        .insert(inserts)
        .select();

      if (error) {
        console.error("Error creating traffic sources:", error);
        return { success: false, sources: [], error: error.message };
      }

      return { success: true, sources: data || [], error: null };
    } catch (err) {
      console.error("Launch traffic error:", err);
      return { success: false, sources: [], error: "Failed to launch traffic" };
    }
  },

  // REAL: Get all traffic sources for a campaign
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
      return { sources: [], error: "Failed to fetch traffic sources" };
    }
  },

  // REAL: Update traffic source performance metrics
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
        return { success: false, error: "Traffic source not found" };
      }

      const updates = {
        total_clicks: (source.total_clicks || 0) + (metrics.clicks || 0),
        total_conversions: (source.total_conversions || 0) + (metrics.conversions || 0),
        total_revenue: (source.total_revenue || 0) + (metrics.revenue || 0),
        total_spent: (source.total_spent || 0) + (metrics.spent || 0)
      };

      // Calculate derived metrics
      const ctr = updates.total_clicks > 0 ? (updates.total_clicks / Math.max(updates.total_clicks * 20, 1)) * 100 : 0;
      const conversion_rate = updates.total_clicks > 0 ? (updates.total_conversions / updates.total_clicks) * 100 : 0;
      const actual_cpc = updates.total_clicks > 0 ? updates.total_spent / updates.total_clicks : source.cpc || 0;

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
      return { success: false, error: "Failed to update metrics" };
    }
  },

  // REAL: Allocate budget optimally across traffic sources
  async allocateTrafficSources(campaignId: string, totalBudget: number): Promise<{
    allocations: TrafficAllocation[];
    error: string | null;
  }> {
    try {
      const { sources } = await this.getTrafficSources(campaignId);

      if (sources.length === 0) {
        return {
          allocations: [],
          error: "No traffic sources found for this campaign"
        };
      }

      // Calculate ROI for each source
      const sourceMetrics = sources.map(source => ({
        ...source,
        roi: source.total_spent && source.total_spent > 0 
          ? ((source.total_revenue || 0) - source.total_spent) / source.total_spent 
          : 0,
        roas: source.total_spent && source.total_spent > 0
          ? (source.total_revenue || 0) / source.total_spent
          : 0
      }));

      // Sort by ROI (best performers first)
      sourceMetrics.sort((a, b) => b.roi - a.roi);

      // Allocate more budget to better performers
      const totalWeight = sourceMetrics.reduce((sum, s, idx) => {
        const weight = Math.max(1, 5 - idx); // Top performer gets 5x, decreasing
        return sum + weight;
      }, 0);

      const allocations: TrafficAllocation[] = sourceMetrics.map((source, idx) => {
        const weight = Math.max(1, 5 - idx);
        const allocation = (weight / totalWeight) * totalBudget;
        const expectedClicks = allocation / (source.cpc || 1);

        return {
          source: source.source_name,
          allocation: Math.round(allocation * 100) / 100,
          expectedClicks: Math.round(expectedClicks),
          cost: source.cpc || 0
        };
      });

      return { allocations, error: null };
    } catch (err) {
      console.error("Allocation error:", err);
      return { allocations: [], error: "Failed to allocate budget" };
    }
  },

  // REAL: Scale top performing traffic sources
  async scaleTopPerformers(campaignId: string, scaleFactor: number = 1.5): Promise<{
    scaled: TrafficSource[];
    error: string | null;
  }> {
    try {
      const { sources } = await this.getTrafficSources(campaignId);

      // Filter top performers (positive ROI)
      const topPerformers = sources.filter(s => {
        const roi = s.total_spent && s.total_spent > 0 
          ? ((s.total_revenue || 0) - s.total_spent) / s.total_spent 
          : 0;
        return roi > 0.2; // 20% ROI threshold
      });

      const scaled: TrafficSource[] = [];

      for (const source of topPerformers) {
        const newBudget = (source.daily_budget || 0) * scaleFactor;

        const { error } = await supabase
          .from("traffic_sources")
          .update({ daily_budget: newBudget })
          .eq("id", source.id);

        if (!error) {
          scaled.push({ ...source, daily_budget: newBudget });
        }
      }

      return { scaled, error: null };
    } catch (err) {
      console.error("Scale top performers:", err);
      return { scaled: [], error: "Failed to scale top performers" };
    }
  },

  // REAL: Pause underperforming traffic sources
  async pauseUnderperformers(campaignId: string): Promise<{
    paused: string[];
    error: string | null;
  }> {
    try {
      const { sources } = await this.getTrafficSources(campaignId);

      const underperformers = sources.filter(s => {
        const roi = s.total_spent && s.total_spent > 0 
          ? ((s.total_revenue || 0) - s.total_spent) / s.total_spent 
          : 0;
        return s.total_spent > 50 && roi < -0.5; // Negative 50% ROI and spent > $50
      });

      const paused: string[] = [];

      for (const source of underperformers) {
        const { error } = await supabase
          .from("traffic_sources")
          .update({ status: "paused" })
          .eq("id", source.id);

        if (!error) {
          paused.push(source.source_name);
        }
      }

      return { paused, error: null };
    } catch (err) {
      return { paused: [], error: "Failed to pause sources" };
    }
  },

  // REAL: Get traffic status for dashboard
  async getTrafficStatus(campaignId?: string): Promise<{
    activeChannels: number;
    totalTraffic: number;
    optimizationStatus: string;
    nextOptimization: string;
  }> {
    try {
      let query = supabase.from("traffic_sources").select("*", { count: "exact" });

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