import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SAFE TRACKING API - Views
 * Tracks view events without breaking existing system
 * If fails → logs error, returns success anyway
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { content_id, platform, views, user_id } = req.body;

    // Validate required fields
    if (!content_id || !platform) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert view event (FAIL-SAFE: if fails, just log it)
    const { error } = await supabase.from("view_events").insert({
      content_id,
      platform,
      views: views || 1,
      user_id: user_id || null,
      tracked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("View tracking error:", error);
      // Return success anyway - tracking failure should not break user flow
      return res.status(200).json({
        success: true,
        tracked: false,
        message: "View recorded (tracking skipped)",
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      tracked: true,
      message: "View tracked successfully",
    });
  } catch (error) {
    console.error("View tracking exception:", error);
    // FAIL-SAFE: Always return success
    return res.status(200).json({
      success: true,
      tracked: false,
      message: "View recorded (tracking error)",
    });
  }
}