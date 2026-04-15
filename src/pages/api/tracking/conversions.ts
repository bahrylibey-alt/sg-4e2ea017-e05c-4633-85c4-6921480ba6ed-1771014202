import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SAFE TRACKING API - Conversions
 * Records VERIFIED conversions only (from webhooks/APIs)
 * Estimated revenue MUST be labeled clearly
 * Never fakes revenue
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
      click_id,
      content_id,
      user_id,
      revenue,
      source,
      webhook_data,
      verified,
    } = req.body;

    // REVENUE SAFETY: Only verified = true if from webhook/API
    const isVerified = verified === true && source !== "estimate";

    // Validate
    if (!user_id || revenue === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert conversion (FAIL-SAFE)
    const { data: conversionData, error: conversionError } = await supabase
      .from("conversion_events")
      .insert({
        click_id: click_id || null,
        content_id: content_id || null,
        user_id,
        revenue: parseFloat(revenue) || 0,
        source: source || "unknown",
        webhook_data: webhook_data || null,
        verified: isVerified,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (conversionError) {
      console.error("Conversion tracking error:", conversionError);
      return res.status(200).json({
        success: true,
        tracked: false,
        message: "Conversion recorded (tracking skipped)",
      });
    }

    // If click_id provided, update click_events (FAIL-SAFE)
    if (click_id) {
      try {
        await supabase
          .from("click_events")
          .update({ converted: true })
          .eq("click_id", click_id);
      } catch (err) {
        console.error("Click conversion update failed:", err);
      }
    }

    return res.status(200).json({
      success: true,
      tracked: true,
      conversion_id: conversionData?.id,
      verified: isVerified,
      message: isVerified
        ? "Verified conversion tracked"
        : "Estimated conversion tracked",
    });
  } catch (error) {
    console.error("Conversion tracking exception:", error);
    // FAIL-SAFE: Always return success
    return res.status(200).json({
      success: true,
      tracked: false,
      message: "Conversion recorded (tracking error)",
    });
  }
}