import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { webhookService } from "@/services/webhookService";

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
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // Get affiliate link details
    const { data: link, error: linkError } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("cloaked_url", `direct /go/${slug}`)
      .single();

    if (linkError || !link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // Increment click count
    const newClicks = (link.clicks || 0) + 1;
    await supabase
      .from("affiliate_links")
      .update({ clicks: newClicks })
      .eq("id", link.id);

    // Get click metadata
    const referrer = req.headers.referer || req.headers.referrer;
    const userAgent = req.headers["user-agent"];

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

    // Send webhook notification to Zapier
    await webhookService.notifyClick(link.user_id, {
      product_name: link.product_name,
      network: link.network,
      cloaked_url: link.cloaked_url
    });

    console.log("✅ Click tracked:", {
      product: link.product_name,
      clicks: newClicks,
      referrer: referrer || "direct"
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