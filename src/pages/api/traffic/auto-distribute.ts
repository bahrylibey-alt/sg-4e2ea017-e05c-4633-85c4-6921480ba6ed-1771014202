import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { magicTrafficEngine } from "@/services/magicTrafficEngine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * AUTO CONTENT DISTRIBUTION API
 * Systematically distributes content across all active traffic sources
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, contentId, auto_discover } = req.body;

    console.log("📢 SYSTEMATIC CONTENT DISTRIBUTION INITIATED");

    // Get user ID
    let actualUserId = userId;
    if (!actualUserId) {
      const { data: users } = await supabase.from("profiles").select("id").limit(1);
      actualUserId = users?.[0]?.id || null;
    }

    if (!actualUserId) {
      return res.status(400).json({ error: "User not found" });
    }

    // If auto_discover enabled, find and activate sources first
    if (auto_discover) {
      console.log("🔍 Auto-discovering traffic sources...");
      await magicTrafficEngine.autoActivateBestSources(actualUserId, 5, supabase);
    }

    // Get content to distribute
    let actualContentId = contentId;
    if (!actualContentId) {
      // Get latest published content
      const { data: content } = await supabase
        .from("generated_content")
        .select("id")
        .eq("user_id", actualUserId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      actualContentId = content?.id;
    }

    if (!actualContentId) {
      return res.status(400).json({
        error: "No content available to distribute. Create content first."
      });
    }

    // Distribute content
    const result = await magicTrafficEngine.distributeContent(
      actualUserId,
      actualContentId,
      supabase
    );

    return res.status(200).json({
      success: true,
      message: "Content distributed systematically",
      ...result,
      analytics: {
        total_platforms: result.distributed_to,
        estimated_reach: result.total_estimated_reach,
        distribution_method: "automated_staggered"
      }
    });

  } catch (error: any) {
    console.error("❌ Distribution error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}