/**
 * DECISION ENGINE
 * Makes RECOMMENDATIONS based on performance scores
 * NEVER executes actions automatically
 */

import { supabase } from "@/integrations/supabase/client";
import { scoringEngine } from "./scoringEngine";

interface Decision {
  type: "scale" | "cooldown" | "kill" | "retest";
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  action: string;
  postId?: string;
  platform?: string;
  productId?: string;
}

export const decisionEngine = {
  /**
   * Analyze post and generate recommendations
   */
  async analyzePost(
    userId: string,
    postId: string
  ): Promise<Decision[]> {
    const decisions: Decision[] = [];

    try {
      // Get post data
      const { data: post } = await supabase
        .from("posted_content")
        .select("*")
        .eq("id", postId)
        .single();

      if (!post) {
        return decisions;
      }

      // Calculate score
      const scoreResult = scoringEngine.calculateScore({
        clicks: post.clicks || 0,
        impressions: post.impressions || 0,
        conversions: post.conversions || 0,
        revenue: Number(post.revenue || 0),
      });

      // WINNER: Score > 0.08
      if (scoreResult.classification === "WINNER") {
        decisions.push({
          type: "scale",
          priority: "HIGH",
          reason: `High performance (score: ${scoreResult.score})`,
          action: "Recommend creating 3 variations of this post",
          postId,
          platform: post.platform,
        });

        decisions.push({
          type: "scale",
          priority: "HIGH",
          reason: "Strong conversion rate",
          action: `Increase posting frequency on ${post.platform} by 25%`,
          postId,
          platform: post.platform,
        });
      }

      // TESTING: Score 0.03-0.08
      else if (scoreResult.classification === "TESTING") {
        decisions.push({
          type: "retest",
          priority: "MEDIUM",
          reason: `Moderate performance (score: ${scoreResult.score})`,
          action: "Try different hook styles to improve engagement",
          postId,
          platform: post.platform,
        });
      }

      // WEAK: Score < 0.03
      else if (scoreResult.classification === "WEAK") {
        decisions.push({
          type: "cooldown",
          priority: "LOW",
          reason: `Low performance (score: ${scoreResult.score})`,
          action: "Reduce posting frequency but keep testing",
          postId,
          platform: post.platform,
        });
      }

      // NO_DATA
      else {
        decisions.push({
          type: "retest",
          priority: "LOW",
          reason: "Insufficient data for analysis",
          action: "Continue current posting schedule to gather metrics",
          postId,
          platform: post.platform,
        });
      }

      // Save decisions (FAIL-SAFE)
      for (const decision of decisions) {
        try {
          await supabase
            .from("autopilot_decisions")
            .insert({
              user_id: userId,
              entity_id: postId,
              entity_type: "post",
              decision_type: decision.type,
              reason: decision.reason,
              metrics: { priority: decision.priority, action: decision.action },
              created_at: new Date().toISOString(),
            });
        } catch (err) {
          console.error("Failed to save decision:", err);
        }
      }

      return decisions;
    } catch (error) {
      console.error("Decision analysis failed:", error);
      return decisions;
    }
  },

  /**
   * Analyze all user's posts and generate recommendations
   */
  async analyzeAllPosts(userId: string): Promise<{
    totalDecisions: number;
    scale: number;
    retest: number;
    cooldown: number;
    kill: number;
    decisions: Decision[];
  }> {
    try {
      // Score all posts first
      const scoreResults = await scoringEngine.scoreAllPosts(userId);

      if (scoreResults.total === 0) {
        return {
          totalDecisions: 0,
          scale: 0,
          retest: 0,
          cooldown: 0,
          kill: 0,
          decisions: [],
        };
      }

      // Generate decisions for each post
      const allDecisions: Decision[] = [];
      
      for (const scoreData of scoreResults.scores) {
        const postDecisions = await this.analyzePost(userId, scoreData.postId);
        allDecisions.push(...postDecisions);
      }

      // Count decision types
      const counts = {
        scale: allDecisions.filter((d) => d.type === "scale").length,
        retest: allDecisions.filter((d) => d.type === "retest").length,
        cooldown: allDecisions.filter((d) => d.type === "cooldown").length,
        kill: allDecisions.filter((d) => d.type === "kill").length,
      };

      return {
        totalDecisions: allDecisions.length,
        ...counts,
        decisions: allDecisions,
      };
    } catch (error) {
      console.error("Failed to analyze all posts:", error);
      return {
        totalDecisions: 0,
        scale: 0,
        retest: 0,
        cooldown: 0,
        kill: 0,
        decisions: [],
      };
    }
  },

  /**
   * Get platform-specific recommendations
   */
  async getPlatformRecommendations(userId: string): Promise<{
    bestPlatform: string | null;
    recommendations: Array<{
      platform: string;
      action: "INCREASE" | "MAINTAIN" | "REDUCE";
      reason: string;
      currentFrequency: number;
      recommendedFrequency: number;
    }>;
  }> {
    try {
      const { data: posts } = await supabase
        .from("posted_content")
        .select("platform, clicks, impressions, conversions")
        .eq("user_id", userId);

      if (!posts || posts.length === 0) {
        return { bestPlatform: null, recommendations: [] };
      }

      // Group by platform
      const platformStats: Record<string, {
        posts: number;
        totalClicks: number;
        totalImpressions: number;
        totalConversions: number;
      }> = {};

      posts.forEach((post) => {
        const platform = post.platform || "unknown";
        if (!platformStats[platform]) {
          platformStats[platform] = {
            posts: 0,
            totalClicks: 0,
            totalImpressions: 0,
            totalConversions: 0,
          };
        }
        platformStats[platform].posts++;
        platformStats[platform].totalClicks += post.clicks || 0;
        platformStats[platform].totalImpressions += post.impressions || 0;
        platformStats[platform].totalConversions += post.conversions || 0;
      });

      // Calculate platform scores
      const platformScores: Array<{
        platform: string;
        score: number;
        conversionRate: number;
      }> = [];

      for (const [platform, stats] of Object.entries(platformStats)) {
        const conversionRate = stats.totalClicks > 0 
          ? stats.totalConversions / stats.totalClicks 
          : 0;
        
        const ctr = stats.totalImpressions > 0 
          ? stats.totalClicks / stats.totalImpressions 
          : 0;

        const score = (ctr * 0.5) + (conversionRate * 0.5);

        platformScores.push({
          platform,
          score,
          conversionRate,
        });
      }

      // Sort by score
      platformScores.sort((a, b) => b.score - a.score);

      // Best platform
      const bestPlatform = platformScores[0]?.platform || null;

      // Generate recommendations
      const recommendations = platformScores.map((ps) => {
        const currentFrequency = platformStats[ps.platform].posts;
        let action: "INCREASE" | "MAINTAIN" | "REDUCE";
        let recommendedFrequency = currentFrequency;
        let reason = "";

        if (ps.conversionRate > 0.08) {
          action = "INCREASE";
          recommendedFrequency = Math.min(20, Math.ceil(currentFrequency * 1.25)); // Max +25%
          reason = `High conversion rate (${(ps.conversionRate * 100).toFixed(1)}%)`;
        } else if (ps.conversionRate < 0.03) {
          action = "REDUCE";
          recommendedFrequency = Math.max(1, Math.ceil(currentFrequency * 0.75));
          reason = `Low conversion rate (${(ps.conversionRate * 100).toFixed(1)}%)`;
        } else {
          action = "MAINTAIN";
          recommendedFrequency = currentFrequency;
          reason = "Moderate performance - continue testing";
        }

        return {
          platform: ps.platform,
          action,
          reason,
          currentFrequency,
          recommendedFrequency,
        };
      });

      return {
        bestPlatform,
        recommendations,
      };
    } catch (error) {
      console.error("Failed to get platform recommendations:", error);
      return { bestPlatform: null, recommendations: [] };
    }
  },
};