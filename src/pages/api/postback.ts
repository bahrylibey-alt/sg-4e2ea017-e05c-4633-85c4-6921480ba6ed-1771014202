import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { webhookService } from "@/integrations/zapier";

/**
 * REAL COMMISSION TRACKING API (S2S Postback)
 * 
 * This endpoint receives REAL conversion data from affiliate networks.
 * When someone buys through your link, the network sends data here.
 * 
 * Supported Networks:
 * - Amazon Associates (via OneLink / Amazon Attribution)
 * - Temu Affiliate Program
 * - AliExpress Affiliate
 * - Any network supporting S2S postbacks
 * 
 * Usage:
 * Configure in affiliate network dashboard:
 * Postback URL: https://yourdomain.com/api/postback?network={network}&click_id={click_id}&amount={amount}&status={status}
 */

interface PostbackData {
  network: string;
  click_id: string;
  transaction_id?: string;
  amount?: number;
  commission?: number;
  status: "pending" | "approved" | "rejected";
  product_id?: string;
  order_id?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests (standard for postbacks)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract postback data from query params or body
    const data: PostbackData = req.method === "POST" 
      ? req.body 
      : req.query as any;

    const {
      network,
      click_id,
      transaction_id,
      amount,
      commission,
      status,
      product_id,
      order_id
    } = data;

    // Validate required fields
    if (!network || !click_id) {
      return res.status(400).json({ 
        error: "Missing required fields: network, click_id" 
      });
    }

    console.log("📥 Postback received:", {
      network,
      click_id,
      transaction_id,
      amount,
      commission,
      status
    });

    // Find the affiliate link by click_id (stored in slug or tracking param)
    const { data: link, error: linkError } = await supabase
      .from("affiliate_links")
      .select("*")
      .or(`slug.eq.${click_id},cloaked_url.ilike.%${click_id}%`)
      .maybeSingle();

    if (linkError || !link) {
      console.error("❌ Link not found for click_id:", click_id);
      // Still return 200 to prevent retries
      return res.status(200).json({ 
        status: "ignored",
        message: "Link not found" 
      });
    }

    // Update link statistics based on postback status
    if (status === "approved") {
      // Real conversion confirmed by network
      const newConversions = (link.conversions || 0) + 1;
      const newRevenue = (link.revenue || 0) + (commission || amount || 0);
      const newConversionRate = link.clicks > 0 
        ? (newConversions / link.clicks) * 100 
        : 0;

      await supabase
        .from("affiliate_links")
        .update({
          conversions: newConversions,
          revenue: newRevenue,
          conversion_rate: newConversionRate,
          last_conversion: new Date().toISOString()
        })
        .eq("id", link.id);

      console.log("✅ Conversion recorded:", {
        product: link.product_name,
        conversions: newConversions,
        revenue: newRevenue
      });

      // Record in conversion_events table for detailed tracking
      await supabase
        .from("conversion_events" as any)
        .insert({
          affiliate_link_id: link.id,
          campaign_id: link.campaign_id,
          user_id: link.user_id,
          network,
          transaction_id: transaction_id || click_id,
          order_id,
          product_id,
          amount: amount || 0,
          commission: commission || amount || 0,
          status,
          conversion_data: {
            click_id,
            network,
            timestamp: new Date().toISOString(),
            postback_data: data
          }
        } as any);

      // Update campaign totals
      const { data: campaignLinks } = await supabase
        .from("affiliate_links")
        .select("revenue")
        .eq("campaign_id", link.campaign_id);

      if (campaignLinks) {
        const totalRevenue = campaignLinks.reduce((sum, l) => sum + (l.revenue || 0), 0);

        await supabase
          .from("campaigns")
          .update({
            revenue: totalRevenue
          })
          .eq("id", link.campaign_id);
      }

      console.log("✅ Commission tracked:", {
        product: link.product_name,
        commission: commission || amount,
        conversions: newConversions
      });

      // Send webhook notification to Zapier
      await webhookService.notifyConversion(link.user_id, {
        product_name: link.product_name,
        network,
        amount: amount || 0,
        commission: commission || amount || 0,
        transaction_id: transaction_id || click_id || "unknown"
      });

      return res.status(200).json({
        status: "success",
        message: "Conversion tracked",
        commission: commission || amount,
        conversions: newConversions
      });

    } else if (status === "pending") {
      // Pending conversion (waiting for approval)
      console.log("⏳ Pending conversion:", {
        product: link.product_name,
        amount: commission || amount
      });

    } else if (status === "rejected") {
      // Rejected conversion (refund, fraud, etc)
      console.log("🔴 Rejected conversion:", {
        product: link.product_name,
        reason: data
      });
    }

    // Return success to prevent network retries
    return res.status(200).json({
      status: "success",
      message: "Postback processed",
      link_id: link.id,
      product: link.product_name
    });

  } catch (error: any) {
    console.error("❌ Postback processing error:", error);
    
    // Still return 200 to prevent infinite retries
    return res.status(200).json({
      status: "error",
      message: error.message
    });
  }
}