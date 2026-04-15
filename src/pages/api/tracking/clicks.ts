import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SAFE TRACKING API - Clicks
 * Tracks click events and updates product metrics
 * If fails → logs error, continues system
 * NO AUTH REQUIRED - For testing purposes
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      link_id,
      content_id,
      platform,
      user_id,
      click_id,
      ip_address,
      user_agent,
      referrer,
    } = req.body;

    // Validate required fields
    if (!link_id) {
      return res.status(400).json({ error: "Missing link_id" });
    }

    // Insert click event (FAIL-SAFE)
    const { data: clickData, error: clickError } = await supabase
      .from("click_events")
      .insert({
        link_id,
        content_id: content_id || null,
        platform: platform || "unknown",
        user_id: user_id || null,
        click_id: click_id || null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        referrer: referrer || null,
        clicked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (clickError) {
      console.error("Click tracking error:", clickError);
      return res.status(200).json({
        success: true,
        tracked: false,
        message: "Click recorded (tracking skipped)",
      });
    }

    // Update product click count (FAIL-SAFE: if fails, continue)
    try {
      const { data } = await supabase
        .from("affiliate_links")
        .select("clicks")
        .eq("id", link_id)
        .single();
        
      if (data) {
        await supabase
          .from("affiliate_links")
          .update({ clicks: (data.clicks || 0) + 1 })
          .eq("id", link_id);
      }
    } catch (err) {
      console.error("Product click count update failed:", err);
    }

    return res.status(200).json({
      success: true,
      tracked: true,
      click_id: clickData?.id,
      message: "Click tracked successfully",
    });
  } catch (error) {
    console.error("Click tracking exception:", error);
    // FAIL-SAFE: Always return success
    return res.status(200).json({
      success: true,
      tracked: false,
      message: "Click recorded (tracking error)",
    });
  }
}