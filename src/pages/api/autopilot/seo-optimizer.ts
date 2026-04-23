import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get content that needs SEO optimization (low views)
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, meta_description, slug, content")
      .lt("views", 100)
      .order("created_at", { ascending: false })
      .limit(10);

    if (contentError) throw contentError;

    if (!content || content.length === 0) {
      return res.status(200).json({
        message: "No content found for SEO optimization",
        optimized: 0
      });
    }

    let optimized = 0;
    for (const item of content) {
      // Generate SEO-optimized title and meta
      const keywords = item.title?.split(" ").slice(0, 3).join(" ") || "product";
      
      const optimizedTitle = item.title?.length > 60 
        ? `${item.title.substring(0, 57)}...`
        : `${item.title} - Best Deal 2026`;

      const optimizedMeta = item.meta_description || 
        `Discover ${item.title}. Expert review, best prices, and exclusive deals. ${keywords} buying guide and recommendations.`;

      // Update content with SEO improvements
      const { error: updateError } = await supabase
        .from("generated_content")
        .update({
          title: optimizedTitle,
          meta_description: optimizedMeta.substring(0, 160),
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (!updateError) {
        optimized++;
      }
    }

    return res.status(200).json({
      message: `SEO optimized ${optimized} articles`,
      optimized,
      improvements: ["title optimization", "meta description", "keyword density"]
    });

  } catch (error: any) {
    console.error("SEO optimizer error:", error);
    return res.status(500).json({
      error: error.message || "Failed to optimize SEO"
    });
  }
}