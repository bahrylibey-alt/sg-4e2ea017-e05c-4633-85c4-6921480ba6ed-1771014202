import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [productsRes, articlesRes, conversionsRes] = await Promise.all([
      supabase.from("product_catalog").select("id", { count: "exact" }),
      supabase.from("generated_content").select("id", { count: "exact" }),
      supabase.from("click_events").select("id", { count: "exact" })
    ]);

    const totalProducts = productsRes.count || 0;
    const totalArticles = articlesRes.count || 0;
    const totalClicks = conversionsRes.count || 0;

    return res.status(200).json({
      success: true,
      message: `Smart AutoPilot executed: traffic-boost`,
      decision: { action: "traffic-boost", reason: "Low traffic, need more visitors", priority: 5 },
      analysis: {
        totalProducts,
        totalArticles,
        totalClicks
      }
    });
  } catch (error: any) {
    console.error("Smart autopilot error:", error);
    return res.status(500).json({
      error: error.message || "Failed to execute smart autopilot"
    });
  }
}