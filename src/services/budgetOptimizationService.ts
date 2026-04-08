import { supabase } from "@/integrations/supabase/client";

export interface BudgetAllocation {
  channel: string;
  amount: number;
  percentage: number;
}

export const budgetOptimizationService = {
  // REAL: Optimize budget allocation
  async optimizeBudgetAllocation(campaignId: string, totalBudget: number): Promise<{
    allocations: BudgetAllocation[];
    projectedRevenue: number;
    error: string | null;
  }> {
    try {
      const { data: sources } = await supabase
        .from("traffic_sources")
        .select("*")
        .eq("campaign_id", campaignId);

      if (!sources || sources.length === 0) {
        return { allocations: [], projectedRevenue: 0, error: "No traffic sources found" };
      }

      // Calculate performance scores
      const scoredSources = sources.map(s => {
        const spent = s.total_spent || 1;
        const revenue = s.total_revenue || 0;
        const roi = (revenue - spent) / spent;
        return { ...s, score: Math.max(0.1, roi + 1) }; // Baseline score
      });

      const totalScore = scoredSources.reduce((sum, s) => sum + s.score, 0);

      const allocations = scoredSources.map(s => ({
        channel: s.source_name,
        percentage: Math.round((s.score / totalScore) * 100),
        amount: Math.round((s.score / totalScore) * totalBudget)
      }));

      // Simple linear projection
      const avgROI = scoredSources.reduce((sum, s) => sum + ((s.total_revenue || 0) / (s.total_spent || 1)), 0) / scoredSources.length;
      const projectedRevenue = totalBudget * avgROI;

      return { allocations, projectedRevenue, error: null };
    } catch (err) {
      return { allocations: [], projectedRevenue: 0, error: "Optimization failed" };
    }
  }
};