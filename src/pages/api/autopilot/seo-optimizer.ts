import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get REAL content that needs SEO optimization
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, content, seo_keywords")
      .eq("user_id", user.id)
      .eq("status", "published")
      .limit(10);

    if (contentError) throw contentError;

    if (!content || content.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No published content to optimize",
        optimized: 0
      });
    }

    let optimized = 0;

    // Optimize existing content
    for (const item of content) {
      // Add SEO keywords if missing
      if (!item.seo_keywords || item.seo_keywords.length === 0) {
        const keywords = [
          "affiliate marketing",
          "best products",
          "product review",
          "top picks"
        ];

        await supabase
          .from("generated_content")
          .update({ seo_keywords: keywords })
          .eq("id", item.id);

        optimized++;
      }
    }

    console.log(`✅ SEO Optimizer: Enhanced ${optimized} real articles`);

    return res.status(200).json({
      success: true,
      message: `Optimized ${optimized} existing articles`,
      optimized
    });

  } catch (error: any) {
    console.error("SEO optimizer error:", error);
    return res.status(500).json({ error: error.message });
  }
}