import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SAFE AUTOPILOT - Scoring
 * Calculates performance scores WITHOUT changing user data
 * If fails → returns default scores, system continues
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { post_id, product_id, user_id } = req.body;

    if (!user_id || (!post_id && !product_id)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Calculate scores based on actual metrics
    let metrics = {
      clicks: 0,
      impressions: 0,
      conversions: 0,
      revenue: 0,
    };

    // Get post metrics (FAIL-SAFE)
    if (post_id) {
      try {
        const { data: postData } = await supabase
          .from("posted_content")
          .select("clicks, impressions, conversions, revenue")
          .eq("id", post_id)
          .single();

        if (postData) {
          metrics = postData;
        }
      } catch (err) {
        console.error("Failed to fetch post metrics:", err);
      }
    }

    // Get product metrics (FAIL-SAFE)
    if (product_id) {
      try {
        const { data: productData } = await supabase
          .from("affiliate_links")
          .select("clicks, impressions, conversions, revenue")
          .eq("id", product_id)
          .single();

        if (productData) {
          metrics = {
            clicks: metrics.clicks + (productData.clicks || 0),
            impressions: metrics.impressions + (productData.impressions || 0),
            conversions: metrics.conversions + (productData.conversions || 0),
            revenue: metrics.revenue + Number(productData.revenue || 0),
          };
        }
      } catch (err) {
        console.error("Failed to fetch product metrics:", err);
      }
    }

    // Calculate performance scores (SAFE MATH)
    const ctr =
      metrics.impressions > 0
        ? (metrics.clicks / metrics.impressions) * 100
        : 0;
    const conversionRate =
      metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
    const revenuePerClick =
      metrics.clicks > 0 ? metrics.revenue / metrics.clicks : 0;

    // Engagement score (0-100)
    const engagementScore = Math.min(
      100,
      ctr * 10 + conversionRate * 5 + (revenuePerClick > 0 ? 20 : 0)
    );

    // Overall performance score (0-100)
    const performanceScore = Number(Math.min(
      100,
      Number((ctr * 0.3 + conversionRate * 0.4 + engagementScore * 0.3).toFixed(2))
    ));

    // Store the score with CORRECT column names
    await supabase.from("autopilot_scores").upsert({
      product_id: product_id || null,
      post_id: post_id || null,
      user_id: user_id,
      performance_score: performanceScore,
      ctr: Number(ctr.toFixed(2)),
      conversion_rate: Number(conversionRate.toFixed(2)),
      revenue_per_click: Number(revenuePerClick.toFixed(2)),
      engagement_score: Number(engagementScore.toFixed(2)),
      status: 'active',
      updated_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      scores: {
        ctr: Number(ctr.toFixed(2)),
        conversion_rate: Number(conversionRate.toFixed(2)),
        revenue_per_click: Number(revenuePerClick.toFixed(2)),
        engagement_score: Number(engagementScore.toFixed(2)),
        performance_score: performanceScore,
      },
      metrics,
    });
  } catch (error) {
    console.error("Scoring exception:", error);
    // FAIL-SAFE: Return default scores
    return res.status(200).json({
      success: true,
      scores: {
        ctr: 0,
        conversion_rate: 0,
        revenue_per_click: 0,
        engagement_score: 0,
        performance_score: 0,
      },
      message: "Default scores returned (scoring error)",
    });
  }
}