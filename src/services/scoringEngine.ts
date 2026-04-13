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
   * Score all user's posts - OPTIMIZED VERSION
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
      console.log('🎯 Scoring Engine: Starting batch scoring for user:', userId);

      // Fetch all posts in one query
      const { data: posts, error } = await supabase
        .from("posted_content")
        .select("id, platform, clicks, impressions, conversions, revenue")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ Scoring Engine: Database error:', error);
        throw error;
      }

      if (!posts || posts.length === 0) {
        console.log('⚠️ Scoring Engine: No posts found');
        return { total: 0, winners: 0, testing: 0, weak: 0, noData: 0, scores: [] };
      }

      console.log(`📊 Scoring Engine: Processing ${posts.length} posts...`);

      let winners = 0;
      let testing = 0;
      let weak = 0;
      let noData = 0;

      // Process all posts in memory (fast)
      const scores = posts.map((post) => {
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

        return {
          postId: post.id,
          platform: post.platform || "unknown",
          score: result.score,
          classification: result.classification,
          ctr: result.metrics.ctr,
          conversionRate: result.metrics.conversionRate,
          revenuePerClick: result.metrics.revenuePerClick,
        };
      });

      console.log(`✅ Scoring Engine: Complete - ${winners} winners, ${testing} testing, ${weak} weak, ${noData} no data`);

      // Batch save scores to database (async, don't block)
      this.batchSaveScores(userId, scores).catch(err => {
        console.error("Failed to save scores (non-blocking):", err);
      });

      return {
        total: posts.length,
        winners,
        testing,
        weak,
        noData,
        scores: scores.map(s => ({
          postId: s.postId,
          platform: s.platform,
          score: s.score,
          classification: s.classification,
        })),
      };
    } catch (error) {
      console.error("❌ Scoring Engine: Failed to score posts:", error);
      return { total: 0, winners: 0, testing: 0, weak: 0, noData: 0, scores: [] };
    }
  },

  /**
   * Batch save scores (non-blocking background operation)
   */
  async batchSaveScores(userId: string, scores: any[]) {
    try {
      // Prepare batch upsert data
      const upsertData = scores.map(s => ({
        user_id: userId,
        post_id: s.postId,
        ctr: s.ctr,
        conversion_rate: s.conversionRate,
        revenue_per_click: s.revenuePerClick,
        performance_score: s.score,
        updated_at: new Date().toISOString(),
      }));

      // Batch upsert (much faster than individual calls)
      const { error } = await supabase
        .from("autopilot_scores")
        .upsert(upsertData);

      if (error) {
        console.error("Failed to batch save scores:", error);
      } else {
        console.log(`✅ Batch saved ${scores.length} scores to database`);
      }
    } catch (error) {
      console.error("Batch save error:", error);
    }
  },
};