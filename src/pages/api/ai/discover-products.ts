import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { OpenAIService } from "@/services/openAIService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { niche, count } = req.body;
    
    if (!niche) {
      return res.status(400).json({ error: "Niche is required" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const openai = new OpenAIService(process.env.OPENAI_API_KEY);

    // Discover trending products using AI
    const products = await openai.discoverTrendingProducts(niche, count || 5);

    // Save to database
    const savedProducts = [];
    for (const product of products) {
      const { data, error } = await supabase
        .from("product_catalog")
        .insert({
          name: product.name,
          category: product.category,
          description: product.why_trending,
          price: null,
          affiliate_url: `https://example.com/${product.name.toLowerCase().replace(/\s+/g, "-")}`,
          status: "active",
          ai_generated: true,
          trend_score: product.trend_score,
          target_audience: product.target_audience
        })
        .select()
        .single();

      if (!error && data) {
        savedProducts.push(data);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Discovered ${savedProducts.length} trending products`,
      products: savedProducts
    });
  } catch (error: unknown) {
    console.error("AI product discovery error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to discover products" 
    });
  }
}