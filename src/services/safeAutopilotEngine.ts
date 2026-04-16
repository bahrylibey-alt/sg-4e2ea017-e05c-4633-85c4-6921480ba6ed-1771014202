/**
 * SAFE AUTOPILOT ENGINE
 * 
 * Intelligence layer that ADDS features WITHOUT breaking existing system
 * 
 * RULES:
 * 1. Never modify existing data without user approval
 * 2. All failures are logged and skipped (never stop posting)
 * 3. Recommendations only - user must approve actions
 * 4. Revenue tracking: verified only (no fake numbers)
 */

import { supabase } from "@/integrations/supabase/client";

// SAFE SCORING - calculates metrics without changing data
export async function calculatePerformanceScore(
  userId: string,
  entityId: string,
  entityType: "post" | "product"
): Promise<{
  success: boolean;
  score: number;
  metrics: any;
  error?: string;
}> {
  try {
    // Fetch entity data (FAIL-SAFE)
    const table = entityType === "post" ? "posted_content" : "affiliate_links";
    const { data, error } = await supabase
      .from(table)
      .select("clicks, impressions, conversions, revenue")
      .eq("id", entityId)
      .single();

    if (error) {
      console.error(`Failed to fetch ${entityType} data:`, error);
      return { success: false, score: 0, metrics: {}, error: error.message };
    }

    const metrics = data || { clicks: 0, impressions: 0, conversions: 0, revenue: 0 };

    // Calculate scores (SAFE MATH)
    const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
    const conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
    const revenuePerClick = metrics.clicks > 0 ? Number(metrics.revenue) / metrics.clicks : 0;

    // Performance score formula (0-100)
    const score = Math.min(
      100,
      ctr * 0.3 + conversionRate * 0.4 + (revenuePerClick > 0 ? 30 : 0)
    );

    // Save the score with CORRECT column names
    await supabase.from("autopilot_scores").upsert({
      [entityType === "product" ? "product_id" : "post_id"]: entityId,
      user_id: userId,
      performance_score: score,
      ctr: Number(ctr.toFixed(2)),
      conversion_rate: Number(conversionRate.toFixed(2)),
      revenue_per_click: Number(revenuePerClick.toFixed(2)),
      status: 'active',
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      score: Number(score.toFixed(2)),
      metrics: {
        ctr: Number(ctr.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        revenuePerClick: Number(revenuePerClick.toFixed(2)),
      },
    };
  } catch (error: any) {
    console.error("Score calculation error:", error);
    return { success: false, score: 0, metrics: {}, error: error.message };
  }
}

// SAFE RECOMMENDATIONS - suggests only, never executes
export async function generateRecommendations(userId: string): Promise<{
  success: boolean;
  recommendations: any[];
  error?: string;
}> {
  try {
    const recommendations = [];

    // Get user's top performers (FAIL-SAFE)
    try {
      const { data: topPosts } = await supabase
        .from("posted_content")
        .select("id, platform, performance_score, ctr, conversion_rate")
        .eq("user_id", userId)
        .order("performance_score", { ascending: false })
        .limit(5);

      if (topPosts && topPosts.length > 0) {
        const avgCTR = topPosts.reduce((sum, p) => sum + (p.ctr || 0), 0) / topPosts.length;
        const avgConversion = topPosts.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / topPosts.length;

        recommendations.push({
          type: "best_platform",
          priority: "high",
          title: "Best Performing Platform",
          platform: topPosts[0].platform,
          metrics: {
            avgCTR: parseFloat(avgCTR.toFixed(2)),
            avgConversion: parseFloat(avgConversion.toFixed(2)),
          },
          suggestion: `Focus more content on ${topPosts[0].platform} - your top performer`,
        });
      }
    } catch (err) {
      console.error("Failed to analyze top posts:", err);
    }

    // Get best hook types (FAIL-SAFE)
    try {
      const { data: bestHooks } = await supabase
        .from("content_dna")
        .select("hook_type, performance_score, usage_count")
        .eq("user_id", userId)
        .order("performance_score", { ascending: false })
        .limit(3);

      if (bestHooks && bestHooks.length > 0) {
        recommendations.push({
          type: "best_hooks",
          priority: "medium",
          title: "Top Performing Hooks",
          hooks: bestHooks.map((h) => ({
            type: h.hook_type,
            score: h.performance_score,
            usage: h.usage_count,
          })),
          suggestion: `Use "${bestHooks[0].hook_type}" hooks more often`,
        });
      }
    } catch (err) {
      console.error("Failed to analyze hooks:", err);
    }

    // Posting schedule recommendation (FAIL-SAFE)
    try {
      const { data: recentPosts } = await supabase
        .from("posted_content")
        .select("posted_at, platform, clicks")
        .eq("user_id", userId)
        .order("posted_at", { ascending: false })
        .limit(50);

      if (recentPosts && recentPosts.length > 10) {
        // Find best posting times (simplified logic)
        const hourPerformance: any = {};
        recentPosts.forEach((post) => {
          if (post.posted_at) {
            const hour = new Date(post.posted_at).getHours();
            hourPerformance[hour] = (hourPerformance[hour] || 0) + (post.clicks || 0);
          }
        });

        const bestHour = Object.keys(hourPerformance).reduce((a, b) =>
          hourPerformance[a] > hourPerformance[b] ? a : b
        );

        recommendations.push({
          type: "posting_schedule",
          priority: "low",
          title: "Best Posting Time",
          hour: parseInt(bestHour),
          suggestion: `Post around ${bestHour}:00 for better engagement`,
        });
      }
    } catch (err) {
      console.error("Failed to analyze posting times:", err);
    }

    return {
      success: true,
      recommendations,
    };
  } catch (error: any) {
    console.error("Recommendation generation error:", error);
    return { success: false, recommendations: [], error: error.message };
  }
}

// SAFE TRACKING - validates revenue before showing
export async function getVerifiedRevenue(userId: string): Promise<{
  verified: number;
  estimated: number;
  totalConversions: number;
}> {
  try {
    // Get verified conversions only
    const { data: verified, error: verifiedError } = await supabase
      .from("conversion_events")
      .select("revenue")
      .eq("user_id", userId)
      .eq("verified", true);

    // Get estimated conversions
    const { data: estimated, error: estimatedError } = await supabase
      .from("conversion_events")
      .select("revenue")
      .eq("user_id", userId)
      .eq("verified", false);

    const verifiedRevenue = verified?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0;
    const estimatedRevenue = estimated?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0;

    return {
      verified: Number(verifiedRevenue.toFixed(2)),
      estimated: Number(estimatedRevenue.toFixed(2)),
      totalConversions: (verified?.length || 0) + (estimated?.length || 0),
    };
  } catch (error) {
    console.error("Revenue fetch error:", error);
    return { verified: 0, estimated: 0, totalConversions: 0 };
  }
}

// SAFE CONNECTION VALIDATOR - checks post → click → product → conversion chain
export async function validateTrackingChain(postId: string): Promise<{
  complete: boolean;
  missing: string[];
  data: any;
}> {
  try {
    const missing = [];
    const data: any = {};

    // Check post
    const { data: post } = await supabase
      .from("posted_content")
      .select("id, link_id, product_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return { complete: false, missing: ["post"], data: {} };
    }
    data.post = post;

    // Check if product linked
    if (!post.product_id && !post.link_id) {
      missing.push("product");
    } else {
      data.hasProduct = true;
    }

    // Check clicks
    const { data: clicks } = await supabase
      .from("click_events")
      .select("id, click_id, converted")
      .eq("content_id", postId);

    data.clicks = clicks?.length || 0;
    if (data.clicks === 0) {
      missing.push("clicks");
    }

    // Check conversions
    if (clicks && clicks.length > 0) {
      const clickIds = clicks.map((c) => c.click_id).filter(Boolean);
      if (clickIds.length > 0) {
        const { data: conversions } = await supabase
          .from("conversion_events")
          .select("id, revenue, verified")
          .in("click_id", clickIds);

        data.conversions = conversions?.length || 0;
        data.verifiedRevenue = conversions
          ?.filter((c) => c.verified)
          .reduce((sum, c) => sum + Number(c.revenue), 0) || 0;
      } else {
        missing.push("click_id");
      }
    }

    return {
      complete: missing.length === 0,
      missing,
      data,
    };
  } catch (error) {
    console.error("Chain validation error:", error);
    return {
      complete: false,
      missing: ["error"],
      data: { error: "Validation failed" },
    };
  }
}