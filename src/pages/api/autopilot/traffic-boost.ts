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
    const { data: articles, error } = await supabase
      .from("generated_content")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return res.status(200).json({
      message: `Generated traffic tactics for ${articles?.length || 0} articles`,
      generated: (articles?.length || 0) * 3,
      platforms: ["Reddit", "Quora", "YouTube"]
    });
  } catch (error: any) {
    console.error("Traffic boost error:", error);
    return res.status(500).json({ error: error.message });
  }
}