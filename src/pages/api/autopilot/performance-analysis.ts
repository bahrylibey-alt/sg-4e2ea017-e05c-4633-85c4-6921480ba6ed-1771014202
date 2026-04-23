import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: content } = await supabase
      .from("generated_content")
      .select("id, title, views, clicks, status")
      .eq("status", "published")
      .order("views", { ascending: false });

    if (!content || content.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No published content to analyze yet",
        insights: [],
        content_analyzed: 0
      });
    }

    const insights = content.slice(0, 5).map(item => ({
      content_id: item.id,
      title: item.title,
      views: item.views || 0,
      clicks: item.clicks || 0,
      ctr: item.views > 0 ? ((item.clicks / item.views) * 100).toFixed(2) : "0.00",
      performance: item.views > 100 ? "Good" : item.views > 50 ? "Average" : "Low",
      recommendation: item.views < 50 
        ? "Consider rewriting or promoting more" 
        : item.clicks < 5
        ? "Add stronger CTAs"
        : "Scale up — performing well"
    }));

    return res.status(200).json({
      success: true,
      message: `Analyzed ${content.length} published articles`,
      insights,
      content_analyzed: content.length,
      top_performers: insights.filter(i => i.performance === "Good").length
    });
  } catch (error: unknown) {
    console.error("Performance analysis error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
  }
}