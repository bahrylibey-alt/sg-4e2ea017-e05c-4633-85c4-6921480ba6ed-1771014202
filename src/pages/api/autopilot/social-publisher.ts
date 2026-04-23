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
    // Get published articles to promote on social media
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from("generated_content")
      .select("id, title, body, user_id")
      .eq("status", "published")
      .limit(3);

    if (articlesError) throw articlesError;

    if (!articles || articles.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No published articles found to share. Publish content first.",
        postsCreated: 0
      });
    }

    // Get an active product for the affiliate link fallback
    const { data: products } = await supabaseAdmin
      .from("product_catalog")
      .select("id, affiliate_url, name")
      .eq("status", "active")
      .limit(1);
      
    const product = products?.[0];
    let created = 0;

    for (const article of articles) {
      // Extract the affiliate link from the article body if it exists, otherwise use product link
      const linkMatch = article.body?.match(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
      const affiliateLink = linkMatch ? linkMatch[1] : (product?.affiliate_url || "https://your-store.com");
      const productId = product?.id;

      if (article.user_id) {
        // Insert into posted_content so it tracks clicks correctly
        const { error: insertError } = await supabaseAdmin
          .from("posted_content")
          .insert({
            user_id: article.user_id,
            platform: "Twitter",
            post_type: "text",
            caption: `📢 New Review: ${article.title}\n\nCheck out the best deal here: ${affiliateLink}\n\n#deals #review`,
            status: "posted",
            product_id: productId
          });
          
        if (!insertError) {
          created++;
        } else {
          console.error("Failed to insert social post:", insertError);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Created ${created} social posts with correct affiliate tracking links`,
      postsCreated: created
    });

  } catch (error: any) {
    console.error("Social publisher error:", error);
    return res.status(500).json({ error: error.message });
  }
}