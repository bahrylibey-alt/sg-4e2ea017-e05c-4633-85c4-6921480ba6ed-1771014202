import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get published articles with affiliate links (no auth required)
    const { data: articles, error: articlesError } = await supabase
      .from("generated_content")
      .select("id, title, product_id, product_catalog(name, affiliate_url)")
      .eq("status", "published")
      .limit(5);

    if (articlesError) throw articlesError;

    if (!articles || articles.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No published articles found. Publish content first.",
        postsCreated: 0
      });
    }

    // Generate social posts with affiliate links
    const socialPosts = articles.map(article => {
      const product = article.product_catalog as any;
      return {
        platform: "Twitter",
        content: `📢 ${article.title}\n\n${product?.name || 'Check it out'}: ${product?.affiliate_url || '#'}`,
        article_id: article.id,
        affiliate_link: product?.affiliate_url
      };
    });

    console.log(`📱 Social Publisher: Created ${socialPosts.length} posts with affiliate links`);

    return res.status(200).json({
      success: true,
      message: `Created ${socialPosts.length} social posts with affiliate links`,
      postsCreated: socialPosts.length,
      posts: socialPosts
    });
  } catch (error: any) {
    console.error("Social publisher error:", error);
    return res.status(500).json({
      error: error.message || "Failed to create social posts"
    });
  }
}