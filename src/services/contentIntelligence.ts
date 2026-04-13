/**
 * CONTENT INTELLIGENCE
 * Tracks what works and learns patterns
 */

import { supabase } from "@/integrations/supabase/client";
import { scoringEngine } from "./scoringEngine";

export const contentIntelligence = {
  /**
   * Analyze top performers
   */
  async analyzeTopPerformers(userId: string): Promise<{
    bestPlatform: string | null;
    bestHook: string | null;
    topProduct: {
      id: string;
      name: string;
      conversionRate: number;
    } | null;
    insights: string[];
  }> {
    const insights: string[] = [];

    try {
      // Get top posts
      const { data: posts } = await supabase
        .from("posted_content")
        .select("*")
        .eq("user_id", userId)
        .order("clicks", { ascending: false })
        .limit(10);

      if (!posts || posts.length === 0) {
        return {
          bestPlatform: null,
          bestHook: null,
          topProduct: null,
          insights: ["No data yet - continue posting to generate insights"],
        };
      }

      // Best platform
      const platformCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const platform = post.platform || "unknown";
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
      const bestPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      if (bestPlatform) {
        insights.push(`${bestPlatform} is your top platform (${platformCounts[bestPlatform]} high-performing posts)`);
      }

      // Best hook type (from content DNA)
      const { data: dnaRecords } = await supabase
        .from("content_dna")
        .select("hook_type, performance_score")
        .eq("user_id", userId)
        .order("performance_score", { ascending: false })
        .limit(1);

      const bestHook = dnaRecords?.[0]?.hook_type || null;

      if (bestHook) {
        insights.push(`"${bestHook}" hooks perform best for you`);
      }

      // Top product (from affiliate links)
      const { data: products } = await supabase
        .from("affiliate_links")
        .select("id, product_name, clicks, conversions")
        .eq("user_id", userId)
        .order("conversions", { ascending: false })
        .limit(1);

      const topProduct = products?.[0] 
        ? {
            id: products[0].id,
            name: products[0].product_name || "Unknown",
            conversionRate: products[0].clicks > 0 
              ? (products[0].conversions || 0) / products[0].clicks 
              : 0,
          }
        : null;

      if (topProduct && topProduct.conversionRate > 0) {
        insights.push(
          `"${topProduct.name}" converts at ${(topProduct.conversionRate * 100).toFixed(1)}%`
        );
      }

      // Post timing insights
      const postHours = posts
        .map((p) => (p.posted_at ? new Date(p.posted_at).getHours() : null))
        .filter((h) => h !== null) as number[];

      if (postHours.length > 0) {
        const avgHour = Math.round(
          postHours.reduce((sum, h) => sum + h, 0) / postHours.length
        );
        insights.push(`Best posting time: around ${avgHour}:00`);
      }

      return {
        bestPlatform,
        bestHook,
        topProduct,
        insights,
      };
    } catch (error) {
      console.error("Failed to analyze top performers:", error);
      return {
        bestPlatform: null,
        bestHook: null,
        topProduct: null,
        insights: ["Analysis temporarily unavailable"],
      };
    }
  },

  /**
   * Get traffic state
   */
  async getTrafficState(userId: string): Promise<
    "NO_DATA" | "LOW" | "ACTIVE" | "SCALING"
  > {
    try {
      const { data: posts, count } = await supabase
        .from("posted_content")
        .select("clicks, impressions", { count: "exact" })
        .eq("user_id", userId);

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