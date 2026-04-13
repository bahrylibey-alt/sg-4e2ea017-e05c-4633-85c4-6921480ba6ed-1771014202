/**
 * SCORING ENGINE
 * Calculates performance scores using real metrics
 * Formula: (CTR * 0.4) + (conversion_rate * 0.4) + (revenue_per_click * 0.2)
 */

import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetrics {
  clicks: number;
  impressions: number;
  conversions: number;
  revenue: number;
}

interface ScoreResult {
  score: number;
  classification: "WINNER" | "TESTING" | "WEAK" | "NO_DATA";
  metrics: {
    ctr: number;
    conversionRate: number;
    revenuePerClick: number;
  };
}

export const scoringEngine = {
  /**
   * Calculate performance score (0-1 scale)
   */
  calculateScore(metrics: PerformanceMetrics): ScoreResult {
    // Handle no data case
    if (metrics.impressions === 0 && metrics.clicks === 0) {
      return {
        score: 0,
        classification: "NO_DATA",
        metrics: { ctr: 0, conversionRate: 0, revenuePerClick: 0 },
      };
    }

    // Calculate individual metrics
    const ctr = metrics.impressions > 0 
      ? metrics.clicks / metrics.impressions 
      : 0;
    
    const conversionRate = metrics.clicks > 0 
      ? metrics.conversions / metrics.clicks 
      : 0;
    
    const revenuePerClick = metrics.clicks > 0 
      ? Number(metrics.revenue) / metrics.clicks 
      : 0;

    // Calculate composite score (0-1 scale)
    const score = (ctr * 0.4) + (conversionRate * 0.4) + (revenuePerClick * 0.2);

    // Classify based on score
    let classification: "WINNER" | "TESTING" | "WEAK" | "NO_DATA";
    if (score > 0.08) classification = "WINNER";
    else if (score >= 0.03) classification = "TESTING";
    else classification = "WEAK";

    return {
      score: Number(score.toFixed(4)),
      classification,
      metrics: {
        ctr: Number(ctr.toFixed(4)),
        conversionRate: Number(conversionRate.toFixed(4)),
        revenuePerClick: Number(revenuePerClick.toFixed(2)),
      },
    };
  },

  /**
   * Score all user's posts
   */
  async scoreAllPosts(userId: string): Promise<{
    total: number;
    winners: number;
    testing: number;
    weak: number;
    noData: number;
    scores: Array<{
      postId: string;
      platform: string;
      score: number;
      classification: string;
    }>;
  }> {
    try {
      const { data: posts } = await supabase
        .from("posted_content")
        .select("id, platform, clicks, impressions, conversions, revenue")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!posts || posts.length === 0) {
        return { total: 0, winners: 0, testing: 0, weak: 0, noData: 0, scores: [] };
      }

      let winners = 0;
      let testing = 0;
      let weak = 0;
      let noData = 0;

      const scores = await Promise.all(posts.map(async (post) => {
        const result = this.calculateScore({
          clicks: post.clicks || 0,
          impressions: post.impressions || 0,
          conversions: post.conversions || 0,
          revenue: Number(post.revenue || 0),
        });

        // Count classifications
        if (result.classification === "WINNER") winners++;
        else if (result.classification === "TESTING") testing++;
        else if (result.classification === "WEAK") weak++;
        else noData++;

        // Save score to database (FAIL-SAFE)
        try {
          await supabase
            .from("autopilot_scores")
            .upsert({
              user_id: userId,
              post_id: post.id,
              ctr: result.metrics.ctr,
              conversion_rate: result.metrics.conversionRate,
              revenue_per_click: result.metrics.revenuePerClick,
              performance_score: result.score,
              classification: result.classification,
              updated_at: new Date().toISOString(),
            });
        } catch (err) {
          console.error("Failed to save score:", err);
        }

        return {
          postId: post.id,
          platform: post.platform || "unknown",
          score: result.score,
          classification: result.classification,
        };
      }));

      return {
        total: posts.length,
        winners,
        testing,
        weak,
        noData,
        scores,
      };
    } catch (error) {
      console.error("Failed to score posts:", error);
      return { total: 0, winners: 0, testing: 0, weak: 0, noData: 0, scores: [] };
    }
  },
};