import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Click = Database["public"]["Tables"]["click_events"]["Row"];

export interface TrafficRoute {
  id: string;
  source: string;
  destination: string;
  conversionRate: number;
  avgValue: number;
  priority: number;
}

export interface RoutingRule {
  condition: string;
  destination: string;
  weight: number;
}

export const intelligentRoutingService = {
  // Analyze click patterns to determine best routing strategies
  async analyzeRouting(campaignId: string): Promise<{
    routes: TrafficRoute[];
    recommendations: string[];
    error: string | null;
  }> {
    try {
      // Get all clicks for campaign
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id, short_code, click_count, conversion_count")
        .eq("campaign_id", campaignId);

      if (!links || links.length === 0) {
        return { routes: [], recommendations: ["Create affiliate links to enable routing optimization"], error: null };
      }

      // Calculate routing performance for each link
      const routes: TrafficRoute[] = links.map(link => {
        const conversionRate = link.click_count > 0 ? (link.conversion_count / link.click_count) * 100 : 0;
        const avgValue = link.conversion_count > 0 ? 50 : 0; // Placeholder, would calculate from actual commissions
        
        return {
          id: link.id,
          source: "Direct Traffic",
          destination: link.short_code,
          conversionRate,
          avgValue,
          priority: conversionRate * avgValue
        };
      });

      // Sort by priority
      routes.sort((a, b) => b.priority - a.priority);

      // Generate recommendations
      const recommendations: string[] = [];
      const bestRoute = routes[0];
      const worstRoute = routes[routes.length - 1];

      if (bestRoute && worstRoute && bestRoute.conversionRate > worstRoute.conversionRate * 2) {
        recommendations.push(`Route more traffic to ${bestRoute.destination} (${bestRoute.conversionRate.toFixed(1)}% conversion rate)`);
      }

      if (routes.some(r => r.conversionRate === 0)) {
        recommendations.push("Some links have zero conversions - consider testing different landing pages");
      }

      return { routes, recommendations, error: null };
    } catch (err) {
      console.error("Routing analysis error:", err);
      return { routes: [], recommendations: [], error: "Failed to analyze routing" };
    }
  },

  // Create geographic-based routing rules
  async createGeoRouting(campaignId: string, rules: RoutingRule[]): Promise<{
    success: boolean;
    rulesCreated: number;
    error: string | null;
  }> {
    try {
      // Store routing rules in campaign metadata
      const { error } = await supabase
        .from("campaigns")
        .update({ 
          content_strategy: JSON.stringify({ routing_rules: rules })
        })
        .eq("id", campaignId);

      if (error) throw error;

      return { success: true, rulesCreated: rules.length, error: null };
    } catch (err) {
      return { success: false, rulesCreated: 0, error: "Failed to create routing rules" };
    }
  },

  // Get best performing destinations
  async getBestDestinations(campaignId: string, limit: number = 5): Promise<{
    destinations: Array<{ url: string; performance: number; traffic: number }>;
    error: string | null;
  }> {
    try {
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("original_url, click_count, conversion_count")
        .eq("campaign_id", campaignId)
        .order("conversion_count", { ascending: false })
        .limit(limit);

      if (!links) {
        return { destinations: [], error: null };
      }

      const destinations = links.map(link => ({
        url: link.original_url,
        performance: link.click_count > 0 ? (link.conversion_count / link.click_count) * 100 : 0,
        traffic: link.click_count
      }));

      return { destinations, error: null };
    } catch (err) {
      return { destinations: [], error: "Failed to fetch destinations" };
    }
  },

  // Segment traffic based on behavior
  async segmentTraffic(campaignId: string): Promise<{
    segments: Array<{ name: string; size: number; conversionRate: number; value: number }>;
    error: string | null;
  }> {
    try {
      const { count } = await supabase
        .from("click_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId);

      if (!count || count === 0) {
        return { 
          segments: [
            { name: "No Data Yet", size: 0, conversionRate: 0, value: 0 }
          ], 
          error: null 
        };
      }

      // Simple segmentation by device (would be more sophisticated in production)
      const segments = [
        {
          name: "All Traffic",
          size: count,
          conversionRate: 0, // Would calculate from conversion data
          value: 0
        }
      ];

      return { segments, error: null };
    } catch (err) {
      return { segments: [], error: "Segmentation failed" };
    }
  }
};