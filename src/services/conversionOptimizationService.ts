import { supabase } from "@/integrations/supabase/client";

export interface OptimizationInsight {
  type: string;
  suggestion: string;
  impact: "high" | "medium" | "low";
  applied: boolean;
}

export const conversionOptimizationService = {
  // REAL: Analyze campaign and generate insights
  async analyzeAndOptimize(campaignId: string): Promise<{
    insights: OptimizationInsight[];
    error: string | null;
  }> {
    try {
      // 1. Fetch performance data
      const { data: metrics } = await supabase
        .from("traffic_sources")
        .select("*")
        .eq("campaign_id", campaignId);

      const insights: OptimizationInsight[] = [];

      if (!metrics || metrics.length === 0) {
        return { insights: [], error: null };
      }

      // 2. Generate Real Insights based on data
      const poorPerformers = metrics.filter(m => (m.total_spent || 0) > 20 && (m.total_revenue || 0) === 0);
      if (poorPerformers.length > 0) {
        insights.push({
          type: "Budget Waste",
          suggestion: `Pause ${poorPerformers.length} traffic sources with 0 ROI`,
          impact: "high",
          applied: false
        });
      }

      const highPerformers = metrics.filter(m => {
        const spent = m.total_spent || 1;
        const revenue = m.total_revenue || 0;
        return (revenue - spent) / spent > 1.5; // >150% ROI
      });

      if (highPerformers.length > 0) {
        insights.push({
          type: "Scaling Opportunity",
          suggestion: `Increase budget by 20% on ${highPerformers.length} top channels`,
          impact: "high",
          applied: false
        });
      }

      // Store insights in DB (omitted for brevity, typically we'd insert into optimization_insights)

      return { insights, error: null };
    } catch (err) {
      return { insights: [], error: "Analysis failed" };
    }
  }
};