import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { webhookService } from "@/services/webhookService";

/**
 * REAL CLICK TRACKING API
 * 
 * This endpoint tracks actual clicks on your affiliate links.
 * Called when someone clicks a product link.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // Get affiliate link details using SLUG
    const { data: link, error: linkError } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (linkError || !link) {
      console.error("Link not found:", slug, linkError);
      return res.status(404).json({ error: "Link not found" });
    }

    // Increment click count - use BOTH columns for compatibility
    const newClicks = (link.clicks || 0) + 1;
    const { error: updateError } = await supabase
      .from("affiliate_links")
      .update({ 
        clicks: newClicks,
        click_count: newClicks
      })
      .eq("id", link.id);

    if (updateError) {
      console.error("Failed to update clicks:", updateError);
    }

    // Get click metadata safely
    const rawReferrer = req.headers.referer || req.headers.referrer;
    const referrer = (Array.isArray(rawReferrer) ? rawReferrer[0] : rawReferrer) || "direct";
    
    const rawUa = req.headers["user-agent"];
    const userAgent = (Array.isArray(rawUa) ? rawUa[0] : rawUa) || "unknown";
    
    const rawIp = req.headers["x-forwarded-for"];
    const ipAddress = (Array.isArray(rawIp) ? rawIp[0] : rawIp) || req.socket?.remoteAddress || "unknown";

    // Record detailed click event
    const { error: eventError } = await supabase
      .from("click_events")
      .insert({
        link_id: link.id,
        user_id: link.user_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
        clicked_at: new Date().toISOString(),
        converted: false,
        is_bot: false,
        fraud_score: 0
      });

    if (eventError) {
      console.error("Failed to record click event:", eventError);
    }

    // Record activity log
    try {
      await supabase
        .from("activity_logs")
        .insert({
          user_id: link.user_id,
          action: "link_click",
          details: `Clicked link for ${link.product_name}`,
          metadata: {
            slug: link.slug,
            product_name: link.product_name,
            referrer: referrer,
            user_agent: userAgent,
            ip_address: ipAddress
          },
          status: "success"
        });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }

    // Send webhook notification to Zapier
    try {
      await webhookService.notifyClick(link.user_id, {
        product_name: link.product_name,
        network: link.network,
        cloaked_url: link.cloaked_url
      });
    } catch (err) {
      console.error("Failed to send webhook:", err);
    }

    console.log("✅ Click tracked:", {
      product: link.product_name,
      slug: link.slug,
      clicks: newClicks,
      referrer: referrer
    });

    return res.status(200).json({
      success: true,
      redirect_url: link.original_url,
      clicks: newClicks
    });

  } catch (error: any) {
    console.error("Click tracking error:", error);
    return res.status(500).json({ error: error.message });
  }
}