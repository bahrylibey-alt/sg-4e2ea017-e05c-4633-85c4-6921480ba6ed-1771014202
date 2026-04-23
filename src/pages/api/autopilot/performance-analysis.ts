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

    // Get REAL content from database
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, status, created_at, views, clicks")
      .eq("user_id", user.id)
      .order("views", { ascending: false });

    if (contentError) throw contentError;

    if (!content || content.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No content yet to analyze",
        analysis: { total: 0, top_performers: [], needs_improvement: [] }
      });
    }

    // Real analysis based on actual data
    const topPerformers = content.slice(0, 5);
    const needsImprovement = content
      .filter(c => (c.views || 0) < 50)
      .slice(0, 5);

    const analysis = {
      total: content.length,
      top_performers: topPerformers.map(c => ({
        id: c.id,
        title: c.title,
        views: c.views || 0,
        clicks: c.clicks || 0
      })),
      needs_improvement: needsImprovement.map(c => ({
        id: c.id,
        title: c.title,
        views: c.views || 0,
        suggestion: "Optimize title and add more keywords"
      }))
    };

    console.log("📊 Performance Analysis (REAL DATA):", analysis);

    return res.status(200).json({
      success: true,
      message: `Analyzed ${content.length} real articles`,
      analysis
    });

  } catch (error: any) {
    console.error("Performance analysis error:", error);
    return res.status(500).json({ error: error.message });
  }
}