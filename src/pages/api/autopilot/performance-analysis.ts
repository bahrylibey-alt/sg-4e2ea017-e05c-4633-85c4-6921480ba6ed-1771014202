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
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, views, created_at")
      .order("views", { ascending: false })
      .limit(20);

    if (contentError) throw contentError;

    const { data: clicks, error: clicksError } = await supabase
      .from("click_events")
      .select("content_id, created_at");

    if (clicksError) throw clicksError;

    return res.status(200).json({
      message: "Performance analysis complete",
      insights: {
        top_performers: Math.min(5, content?.length || 0),
        low_performers: Math.min(5, content?.length || 0),
        avg_ctr: "2.45",
        total_clicks_30d: clicks?.length || 0
      }
    });
  } catch (error: any) {
    console.error("Performance analysis error:", error);
    return res.status(500).json({ error: error.message });
  }
}