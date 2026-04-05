import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * REAL CLICK TRACKING API
 * 
 * This endpoint tracks actual clicks on your affiliate links.
 * Called when someone clicks a product link.
 * 
 * Flow:
 * 1. User clicks /go/product-slug
 * 2. Next.js redirect page calls this API
 * 3. We record the click and metadata
 * 4. Redirect to affiliate URL
 * 
 * Data captured:
 * - Referrer (where click came from)
 * - User agent (device type)
 * - IP address (for fraud detection)
 * - Timestamp
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { slug, referrer, userAgent } = req.body;

    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // Get link from database
    const { data: link, error } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // Record click with metadata
    const newClicks = (link.clicks || 0) + 1;
    const clickData = {
      timestamp: new Date().toISOString(),
      referrer: referrer || "direct",
      user_agent: userAgent || "unknown",
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress
    };

    // Update link clicks
    await supabase
      .from("affiliate_links")
      .update({
        clicks: newClicks,
        last_clicked: new Date().toISOString()
      })
      .eq("id", link.id);

    // Store detailed click event
    await supabase
      .from("click_events" as any)
      .insert({
        link_id: link.id,
        user_id: link.user_id,
        referrer: referrer || "direct",
        user_agent: userAgent || "unknown",
        ip_address: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress
      } as any);

    console.log("✅ Click tracked:", {
      product: link.product_name,
      clicks: newClicks,
      referrer: clickData.referrer
    });

    return res.status(200).json({
      success: true,
      redirect_url: link.original_url,
      clicks: newClicks
    });

  } catch (error: any) {
    console.error("❌ Click tracking error:", error);
    return res.status(500).json({ error: error.message });
  }
}