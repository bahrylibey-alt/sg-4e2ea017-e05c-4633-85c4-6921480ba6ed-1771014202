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

    const { data: products } = await supabase
      .from("product_catalog")
      .select("id, name, affiliate_url")
      .eq("status", "active")
      .limit(3);

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active products found. Add products to generate traffic tactics.",
        tactics: []
      });
    }

    const tactics = products.flatMap(product => [
      {
        platform: "Reddit",
        product_name: product.name,
        tactic: `Post product review in relevant subreddits`,
        affiliate_url: product.affiliate_url
      },
      {
        platform: "Quora",
        product_name: product.name,
        tactic: `Answer questions about similar products`,
        affiliate_url: product.affiliate_url
      },
      {
        platform: "YouTube",
        product_name: product.name,
        tactic: `Create unboxing or comparison video`,
        affiliate_url: product.affiliate_url
      }
    ]);

    return res.status(200).json({
      success: true,
      message: `Generated ${tactics.length} traffic tactics for ${products.length} products`,
      tactics,
      products_count: products.length
    });
  } catch (error: unknown) {
    console.error("Traffic boost error:", error);
    return res.status(500).json({ error: error.message });
  }
}