import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get active products (no auth required - public endpoint)
    const { data: products, error: productsError } = await supabase
      .from("product_catalog")
      .select("id, name, category, affiliate_url")
      .eq("status", "active")
      .limit(5);

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active products found. Add products first.",
        tactics: []
      });
    }

    // Generate traffic tactics based on real products
    const tactics = products.map(product => ({
      product_id: product.id,
      product_name: product.name,
      tactics: [
        {
          platform: "Reddit",
          tactic: `Post in r/${product.category || 'products'} with review and discussion`,
          affiliate_link: product.affiliate_url
        },
        {
          platform: "Quora",
          tactic: `Answer questions about ${product.name} alternatives`,
          affiliate_link: product.affiliate_url
        },
        {
          platform: "YouTube",
          tactic: `Create 60-second review short for ${product.name}`,
          affiliate_link: product.affiliate_url
        }
      ]
    }));

    console.log(`🚀 Traffic Boost: Generated tactics for ${products.length} real products`);

    return res.status(200).json({
      success: true,
      message: `Generated traffic tactics for ${products.length} products`,
      tactics
    });

  } catch (error: any) {
    console.error("Traffic boost error:", error);
    return res.status(500).json({ error: error.message });
  }
}