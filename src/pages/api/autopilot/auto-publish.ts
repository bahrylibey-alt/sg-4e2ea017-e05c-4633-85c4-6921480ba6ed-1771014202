import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get REAL draft content ready to publish (no auth required)
    const { data: drafts, error: draftError } = await supabase
      .from("generated_content")
      .select("id, title, body, status, product_id, product_catalog(affiliate_url)")
      .eq("status", "draft")
      .limit(5);

    if (draftError) throw draftError;

    if (!drafts || drafts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No draft content ready to publish",
        published: 0
      });
    }

    let published = 0;

    // Publish draft content with affiliate links
    for (const item of drafts) {
      const product = item.product_catalog as any;
      const affiliateUrl = product?.affiliate_url || "";
      
      // Ensure content has affiliate link embedded
      let bodyWithLink = item.body || "";
      if (affiliateUrl && !bodyWithLink.includes(affiliateUrl)) {
        bodyWithLink += `\n\n[Get it here](${affiliateUrl})`;
      }

      const { error: updateError } = await supabase
        .from("generated_content")
        .update({ 
          status: "published",
          body: bodyWithLink,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (!updateError) {
        published++;
        console.log(`✅ Published with affiliate link: ${item.title}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Published ${published} articles with affiliate links`,
      published
    });

  } catch (error: any) {
    console.error("Auto publish error:", error);
    return res.status(500).json({ error: error.message });
  }
}