/**
 * AI INSIGHTS ENGINE
 * Generates actionable insights for users
 */

import { supabase } from "@/integrations/supabase/client";
import { scoringEngine } from "./scoringEngine";
import { decisionEngine } from "./decisionEngine";

export const contentIntelligence = {
  async analyzeTopPerformers(userId: string): Promise<{
    bestPlatform: string | null;
    bestHook: string | null;
    topProduct: { id: string; name: string; conversionRate: number; } | null;
    insights: string[];
  }> {
    const insights: string[] = [];
    try {
      const { data: posts } = await supabase.from("posted_content").select("*").eq("user_id", userId).order("clicks", { ascending: false }).limit(10);
      if (!posts || posts.length === 0) {
        return { bestPlatform: null, bestHook: null, topProduct: null, insights: ["No data yet - continue posting to generate insights"] };
      }

      const platformCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const platform = post.platform || "unknown";
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
      const bestPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      if (bestPlatform) insights.push(`${bestPlatform} is your top platform (${platformCounts[bestPlatform]} high-performing posts)`);

      const { data: dnaRecords } = await supabase.from("content_dna").select("hook_type, performance_score").eq("user_id", userId).order("performance_score", { ascending: false }).limit(1);
      const bestHook = dnaRecords?.[0]?.hook_type || null;
      if (bestHook) insights.push(`"${bestHook}" hooks perform best for you`);

      const { data: products } = await supabase.from("affiliate_links").select("id, product_name, clicks, conversions").eq("user_id", userId).order("conversions", { ascending: false }).limit(1);
      const topProduct = products?.[0] ? {
        id: products[0].id,
        name: products[0].product_name || "Unknown",
        conversionRate: products[0].clicks > 0 ? (products[0].conversions || 0) / products[0].clicks : 0,
      } : null;
      if (topProduct && topProduct.conversionRate > 0) insights.push(`"${topProduct.name}" converts at ${(topProduct.conversionRate * 100).toFixed(1)}%`);

      const postHours = posts.map((p) => (p.posted_at ? new Date(p.posted_at).getHours() : null)).filter((h) => h !== null) as number[];
      if (postHours.length > 0) {
        const avgHour = Math.round(postHours.reduce((sum, h) => sum + h, 0) / postHours.length);
        insights.push(`Best posting time: around ${avgHour}:00`);
      }

      return { bestPlatform, bestHook, topProduct, insights };
    } catch (error) {
      console.error("Failed to analyze top performers:", error);
      return { bestPlatform: null, bestHook: null, topProduct: null, insights: ["Analysis temporarily unavailable"] };
    }
  },

  async getTrafficState(userId: string): Promise<"NO_DATA" | "LOW" | "ACTIVE" | "SCALING"> {
    try {
      const { data: posts, count } = await supabase.from("posted_content").select("clicks, impressions", { count: "exact" }).eq("user_id", userId);
      if (!count || count === 0) return "NO_DATA";
      const totalClicks = posts?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;
      const totalImpressions = posts?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0;
      if (totalImpressions < 100) return "LOW";
      if (totalClicks < 10) return "ACTIVE";
      return "SCALING";
    } catch (error) {
      console.error("Failed to get traffic state:", error);
      return "NO_DATA";
    }
  },
};

interface AIInsights {
  summary: {
    totalPosts: number;
    winners: number;
    testing: number;
    weak: number;
    trafficState: "NO_DATA" | "LOW" | "ACTIVE" | "SCALING";
  };
  topPerformers: {
    bestPlatform: string | null;
    bestHook: string | null;
    topProduct: {
      id: string;
      name: string;
      conversionRate: number;
    } | null;
  };
  recommendations: Array<{
    type: string;
    priority: string;
    action: string;
    reason: string;
  }>;
  insights: string[];
  nextSteps: string[];
}

export const aiInsightsEngine = {
  /**
   * Generate complete AI insights for user
   */
  async generateInsights(userId: string): Promise<AIInsights> {
    try {
      // Step 1: Score all posts
      const scoreResults = await scoringEngine.scoreAllPosts(userId);

      // Step 2: Get traffic state
      const trafficState = await contentIntelligence.getTrafficState(userId);

      // Step 3: Analyze top performers
      const topPerformers = await contentIntelligence.analyzeTopPerformers(userId);

      // Step 4: Generate decisions
      const decisions = await decisionEngine.analyzeAllPosts(userId);

      // Step 5: Generate next steps
      const nextSteps: string[] = [];

      if (trafficState === "NO_DATA") {
        nextSteps.push("Post your first content to start collecting data");
        nextSteps.push("Connect at least one affiliate product");
        nextSteps.push("Wait 24-48 hours for initial metrics");
      } else if (trafficState === "LOW") {
        nextSteps.push("Continue posting consistently (3-5 posts/week)");
        nextSteps.push("Test different platforms to find your best fit");
        nextSteps.push("Try various hook types to see what resonates");
      } else if (trafficState === "ACTIVE") {
        nextSteps.push("Focus on your best platform");
        nextSteps.push("Create variations of top posts");
        nextSteps.push("Monitor conversion rates closely");
      } else {
        // SCALING
        nextSteps.push("Scale winners by 25% max");
        nextSteps.push("Reduce weak performers");
        nextSteps.push("Test new products in your niche");
      }

      // Build insights summary
      const insights = {
        summary: {
          totalPosts: scoreResults.total,
          winners: scoreResults.winners,
          testing: scoreResults.testing,
          weak: scoreResults.weak,
          trafficState,
        },
        topPerformers: {
          bestPlatform: topPerformers.bestPlatform,
          bestHook: topPerformers.bestHook,
          topProduct: topPerformers.topProduct,
        },
        recommendations: decisions.decisions.slice(0, 5).map((d) => ({
          type: d.type,
          priority: d.priority,
          action: d.action,
          reason: d.reason,
        })),
        insights: topPerformers.insights,
        nextSteps,
      };

      // Save insights (FAIL-SAFE)
      try {
        await supabase
          .from("autopilot_scores")
          .upsert({
            user_id: userId,
            traffic_state: trafficState,
            insights: topPerformers.insights,
            next_steps: nextSteps,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error("Failed to save insights:", err);
      }

      return insights;
    } catch (error) {
      console.error("Failed to generate insights:", error);
      return {
        summary: {
          totalPosts: 0,
          winners: 0,
          testing: 0,
          weak: 0,
          trafficState: "NO_DATA",
        },
        topPerformers: {
          bestPlatform: null,
          bestHook: null,
          topProduct: null,
        },
        recommendations: [],
        insights: ["Insights temporarily unavailable"],
        nextSteps: ["Continue posting - data collection in progress"],
      };
    }
  },

  /**
   * Get quick summary
   */
  async getQuickSummary(userId: string): Promise<{
    status: "collecting_data" | "learning" | "optimizing" | "scaling";
    message: string;
    metric: number;
  }> {
    try {
      const trafficState = await contentIntelligence.getTrafficState(userId);

      switch (trafficState) {
        case "NO_DATA":
          return {
            status: "collecting_data",
            message: "Post content to start collecting data",
            metric: 0,
          };
        case "LOW":
          return {
            status: "learning",
            message: "Learning your audience preferences",
            metric: 25,
          };
        case "ACTIVE":
          return {
            status: "optimizing",
            message: "Optimizing based on performance data",
            metric: 60,
          };
        case "SCALING":
          return {
            status: "scaling",
            message: "Scaling your best performers",
            metric: 90,
          };
      }
    } catch (error) {
      console.error("Failed to get quick summary:", error);
      return {
        status: "collecting_data",
        message: "Status check unavailable",
        metric: 0,
      };
    }
  },
};