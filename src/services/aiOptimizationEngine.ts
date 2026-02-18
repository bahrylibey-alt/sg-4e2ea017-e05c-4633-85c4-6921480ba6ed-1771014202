import { supabase } from "@/integrations/supabase/client";
import { trafficAutomationService } from "./trafficAutomationService";
import { conversionOptimizationService } from "./conversionOptimizationService";
import { retargetingService } from "./retargetingService";
import { budgetOptimizationService } from "./budgetOptimizationService";

export interface OptimizationResult {
  campaignId: string;
  optimizationsApplied: number;
  improvements: {
    metric: string;
    before: number;
    after: number;
    improvement: string;
  }[];
  recommendations: string[];
  nextOptimizationIn: number;
}

export const aiOptimizationEngine = {
  // Run complete AI optimization cycle with PERSISTENT logging
  async runFullOptimization(campaignId: string): Promise<{
    result: OptimizationResult | null;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { result: null, error: "User not authenticated" };
      }

      const improvements = [];
      let optimizationsApplied = 0;
      const logs = [];

      // 1. Optimize conversion funnel (Real Analysis)
      const conversionResult = await conversionOptimizationService.analyzeAndOptimize(campaignId);
      if (conversionResult.insights.length > 0) {
        const topInsight = conversionResult.insights[0];
        improvements.push({
          metric: "Conversion Potential",
          before: 0, 
          after: 0, // Real values would require historical comparison
          improvement: topInsight.impact
        });
        optimizationsApplied++;
        logs.push({
          campaign_id: campaignId,
          action_type: "conversion_optimization",
          description: `Applied insight: ${topInsight.suggestion}`,
          impact_score: topInsight.impact
        });
      }

      // 2. Optimize budget allocation (Real Allocation)
      // Get current budget from campaign
      const { data: campaign } = await supabase.from("campaigns").select("budget").eq("id", campaignId).single();
      const currentBudget = campaign?.budget || 1000;

      const budgetResult = await budgetOptimizationService.optimizeBudgetAllocation(campaignId, currentBudget);
      if (budgetResult.allocations.length > 0) {
        optimizationsApplied++;
        logs.push({
          campaign_id: campaignId,
          action_type: "budget_reallocation",
          description: `Reallocated budget across ${budgetResult.allocations.length} channels`,
          impact_score: "High"
        });
      }

      // 3. Create retargeting audiences (Real Segments)
      const audienceResult = await retargetingService.getAudienceInsights(campaignId);
      if (audienceResult.segments.length > 0) {
        optimizationsApplied++;
        // Create actual audience segment in DB
        await retargetingService.createAudience({
          campaign_id: campaignId,
          name: `Auto-Segment ${new Date().toISOString().split('T')[0]}`,
          audience_type: "high_intent",
          duration_days: 30
        });
        
        logs.push({
          campaign_id: campaignId,
          action_type: "retargeting_update",
          description: "Created new high-intent audience segment",
          impact_score: "Medium"
        });
      }

      // 4. Scale top-performing traffic sources (Real Scaling)
      const trafficResult = await trafficAutomationService.scaleTopPerformers(campaignId);
      if (trafficResult.scaled.length > 0) {
        optimizationsApplied++;
        logs.push({
          campaign_id: campaignId,
          action_type: "traffic_scaling",
          description: `Scaled sources: ${trafficResult.scaled.join(", ")}`,
          impact_score: "Very High"
        });
      }

      // Persist logs to database
      if (logs.length > 0) {
        const { error: logError } = await supabase
          .from("optimization_logs")
          .insert(logs);
          
        if (logError) console.error("Failed to save optimization logs:", logError);
      }

      const result: OptimizationResult = {
        campaignId,
        optimizationsApplied,
        improvements,
        recommendations: conversionResult.insights.map(i => i.suggestion).slice(0, 5),
        nextOptimizationIn: 24
      };

      return { result, error: null };
    } catch (err) {
      console.error("AI Optimization Error:", err);
      return { result: null, error: "Optimization engine failed" };
    }
  },

  // Automated A/B test winner scaling
  async autoScaleWinners(campaignId: string): Promise<{
    scaled: string[];
    budgetIncreased: number;
    error: string | null;
  }> {
    try {
      // Logic to find winning variants from DB
      // This is a placeholder for the logic that would query ab_tests table
      // For now returning empty to ensure no fake data is returned
      return { scaled: [], budgetIncreased: 0, error: null };
    } catch (err) {
      return { scaled: [], budgetIncreased: 0, error: "Auto-scaling failed" };
    }
  },

  // Run continuous optimization cycle
  async optimizeCampaign(campaignId: string): Promise<{
    actionsTaken: string[];
    improvements: string[];
    error: string | null;
  }> {
    try {
      const { result } = await this.runFullOptimization(campaignId);
      
      return { 
        actionsTaken: result?.recommendations || [], 
        improvements: result?.improvements.map(i => `${i.metric}: ${i.improvement}`) || [], 
        error: null 
      };
    } catch (err) {
      return { actionsTaken: [], improvements: [], error: "AI optimization failed" };
    }
  }
};