import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SAFE AUTOPILOT - Recommendations
 * Suggests improvements WITHOUT changing anything
 * User MUST approve before changes happen
 * If fails → returns empty recommendations
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

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const recommendations = [];

    // Get scores (FAIL-SAFE)
    let scores = null;
    try {
      const query = supabase
        .from("autopilot_scores")
        .select("*")
        .eq("user_id", user_id);

      if (post_id) query.eq("post_id", post_id);
      if (product_id) query.eq("product_id", product_id);

      const { data } = await query.single();
      scores = data;
    } catch (err) {
      console.error("Failed to fetch scores:", err);
    }

    // Generate recommendations based on scores (SAFE LOGIC)
    if (scores) {
      // CTR recommendations
      if (scores.ctr < 2) {
        recommendations.push({
          type: "hook",
          priority: "high",
          title: "Improve Hook",
          description: "CTR below 2% - try stronger curiosity hooks",
          suggestion: "Use pattern interrupts, numbers, or questions in opening",
        });
      }

      // Conversion recommendations
      if (scores.conversion_rate < 1) {
        recommendations.push({
          type: "cta",
          priority: "high",
          title: "Strengthen CTA",
          description: "Conversion rate below 1% - improve call-to-action",
          suggestion: "Add urgency, social proof, or clear benefit statement",
        });
      }

      // Platform recommendations (SAFE SUGGESTIONS)
      if (scores.engagement_score < 30) {
        recommendations.push({
          type: "platform",
          priority: "medium",
          title: "Try Different Platform",
          description: "Low engagement - consider testing other platforms",
          suggestion: "Test TikTok or Instagram Reels for higher engagement",
        });
      }

      // Best hook type (from content_dna if available)
      try {
        const { data: dnaData } = await supabase
          .from("content_dna")
          .select("hook_type, performance_score")
          .eq("user_id", user_id)
          .order("performance_score", { ascending: false })
          .limit(1)
          .single();

        if (dnaData && dnaData.hook_type) {
          recommendations.push({
            type: "hook_type",
            priority: "low",
            title: "Best Performing Hook",
            description: `Your "${dnaData.hook_type}" hooks perform best`,
            suggestion: `Use "${dnaData.hook_type}" style more often`,
          });
        }
      } catch (err) {
        console.error("Failed to fetch best hook:", err);
      }
    } else {
      // Default recommendations when no data
      recommendations.push({
        type: "data",
        priority: "low",
        title: "Need More Data",
        description: "Continue testing to generate recommendations",
        suggestion: "Post consistently for 7 days to gather insights",
      });
    }

    // Save recommendations (FAIL-SAFE)
    try {
      await supabase
        .from("autopilot_scores")
        .update({
          recommendations,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (post_id) {
        await supabase
          .from("autopilot_scores")
          .update({ recommendations })
          .eq("post_id", post_id);
      }
      if (product_id) {
        await supabase
          .from("autopilot_scores")
          .update({ recommendations })
          .eq("product_id", product_id);
      }
    } catch (err) {
      console.error("Failed to save recommendations:", err);
    }

    return res.status(200).json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("Recommendation exception:", error);
    // FAIL-SAFE: Return empty recommendations
    return res.status(200).json({
      success: true,
      recommendations: [],
      count: 0,
      message: "No recommendations available (error occurred)",
    });
  }
}