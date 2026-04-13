/**
 * VIRAL ENGINE
 * Controlled content multiplication
 * Tests variations, scales only winners
 */

import { supabase } from "@/integrations/supabase/client";
import { scoringEngine } from "./scoringEngine";

interface VariationTemplate {
  hookType: "curiosity" | "benefit" | "question" | "stat" | "story";
  template: string;
  example: string;
}

const HOOK_TEMPLATES: VariationTemplate[] = [
  {
    hookType: "curiosity",
    template: "You won't believe what happened when...",
    example: "You won't believe what happened when I tried this product",
  },
  {
    hookType: "benefit",
    template: "Here's how to [benefit] in [timeframe]",
    example: "Here's how to save 50% in 5 minutes",
  },
  {
    hookType: "question",
    template: "What if you could [benefit]?",
    example: "What if you could get free shipping every time?",
  },
  {
    hookType: "stat",
    template: "[Number]% of people don't know this...",
    example: "87% of people don't know this money-saving trick",
  },
  {
    hookType: "story",
    template: "I discovered this by accident...",
    example: "I discovered this by accident and it changed everything",
  },
];

export const viralEngine = {
  /**
   * Generate 3 variations of a winning post
   */
  async generateVariations(
    userId: string,
    postId: string
  ): Promise<{
    success: boolean;
    variations: Array<{
      hookType: string;
      content: string;
      platform: string;
    }>;
  }> {
    try {
      // Get original post
      const { data: post } = await supabase
        .from("posted_content")
        .select("*")
        .eq("id", postId)
        .single();

      if (!post) {
        return { success: false, variations: [] };
      }

      // Check if it's a winner
      const score = scoringEngine.calculateScore({
        clicks: post.clicks || 0,
        impressions: post.impressions || 0,
        conversions: post.conversions || 0,
        revenue: Number(post.revenue || 0),
      });

      if (score.classification !== "WINNER") {
        console.log("Post not a winner - skipping variations");
        return { success: false, variations: [] };
      }

      // Generate 3 variations with different hooks
      const variations = HOOK_TEMPLATES.slice(0, 3).map((template) => ({
        hookType: template.hookType,
        content: `${template.template}\n\n${post.caption || ""}`,
        platform: post.platform || "unknown",
      }));

      // Save variation recommendations (FAIL-SAFE)
      try {
        await supabase
          .from("autopilot_decisions")
          .insert({
            user_id: userId,
            entity_id: postId,
            entity_type: "post",
            decision_type: "TEST_VARIATIONS",
            reason: "Winner post - testing variations",
            metrics: { priority: "HIGH", action: `Generated ${variations.length} variations for testing` },
            created_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error("Failed to save variation decision:", err);
      }

      return {
        success: true,
        variations,
      };
    } catch (error) {
      console.error("Failed to generate variations:", error);
      return { success: false, variations: [] };
    }
  },

  /**
   * Track content DNA for future learning
   */
  async trackContentDNA(
    userId: string,
    postId: string,
    hookType: string
  ): Promise<void> {
    try {
      // Get post performance
      const { data: post } = await supabase
        .from("posted_content")
        .select("clicks, impressions, conversions")
        .eq("id", postId)
        .single();

      if (!post) return;

      const score = scoringEngine.calculateScore({
        clicks: post.clicks || 0,
        impressions: post.impressions || 0,
        conversions: post.conversions || 0,
        revenue: 0,
      });

      // Save to content DNA
      await supabase.from("content_dna").upsert({
        user_id: userId,
        content_id: postId,
        hook_type: hookType,
        performance_score: score.score,
        dna_hash: `${postId}_${hookType}`,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to track content DNA:", error);
    }
  },

  /**
   * Get best performing hook types
   */
  async getBestHooks(userId: string): Promise<{
    topHook: string | null;
    hooks: Array<{
      type: string;
      avgScore: number;
      usage: number;
    }>;
  }> {
    try {
      const { data: dnaRecords } = await supabase
        .from("content_dna")
        .select("hook_type, performance_score")
        .eq("user_id", userId)
        .order("performance_score", { ascending: false });

      if (!dnaRecords || dnaRecords.length === 0) {
        return { topHook: null, hooks: [] };
      }

      // Group by hook type
      const hookStats: Record<string, {
        totalScore: number;
        usage: number;
      }> = {};

      dnaRecords.forEach((record) => {
        if (!hookStats[record.hook_type]) {
          hookStats[record.hook_type] = { totalScore: 0, usage: 0 };
        }
        hookStats[record.hook_type].totalScore += record.performance_score || 0;
        hookStats[record.hook_type].usage += 1;
      });

      // Calculate averages
      const hooks = Object.entries(hookStats).map(([type, stats]) => ({
        type,
        avgScore: stats.totalScore / stats.usage,
        usage: stats.usage,
      }));

      // Sort by average score
      hooks.sort((a, b) => b.avgScore - a.avgScore);

      return {
        topHook: hooks[0]?.type || null,
        hooks,
      };
    } catch (error) {
      console.error("Failed to get best hooks:", error);
      return { topHook: null, hooks: [] };
    }
  },

  /**
   * Safe scaling limits
   */
  getScalingLimits(): {
    maxPostsPerDay: number;
    maxScalingPercentage: number;
  } {
    return {
      maxPostsPerDay: 20, // Per platform
      maxScalingPercentage: 25, // Max +25% per cycle
    };
  },
};