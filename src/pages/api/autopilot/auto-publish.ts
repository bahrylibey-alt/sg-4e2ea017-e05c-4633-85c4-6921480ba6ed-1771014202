import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get draft content
    const { data: drafts, error: draftError } = await supabaseAdmin
      .from("generated_content")
      .select("id, title, body, status")
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

    // Get an active product to extract the correct affiliate link
    const { data: products } = await supabaseAdmin
      .from("product_catalog")
      .select("affiliate_url, name")
      .eq("status", "active")
      .limit(1);
    
    const product = products?.[0];
    let published = 0;

    // Publish draft content and ENSURE the correct affiliate link is embedded
    for (const item of drafts) {
      let bodyWithLink = item.body || "";
      
      // If we have a product and its link isn't already in the body, append it
      if (product?.affiliate_url && !bodyWithLink.includes(product.affiliate_url)) {
        bodyWithLink += `\n\n👉 **[Get ${product.name} at the Best Price Here](${product.affiliate_url})**`;
      }

      const { error: updateError } = await supabaseAdmin
        .from("generated_content")
        .update({ 
          status: "published",
          body: bodyWithLink,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (!updateError) {
        published++;
        console.log(`✅ Published with correct affiliate link: ${item.title}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully published ${published} articles with embedded tracking links`,
      published
    });

  } catch (error: any) {
    console.error("Auto publish error:", error);
    return res.status(500).json({ error: error.message });
  }
}