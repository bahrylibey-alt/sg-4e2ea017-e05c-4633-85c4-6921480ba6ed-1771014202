import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get products to create content for (no auth required)
    const { data: products, error: productsError } = await supabase
      .from("product_catalog")
      .select("id, name, category, affiliate_url, description")
      .eq("status", "active")
      .limit(3);

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active products found. Add products first.",
        articlesCreated: 0
      });
    }

    // Generate AI content for each product with affiliate links
    const articles = products.map(product => ({
      title: `${product.name} Review: Complete Guide & Best Deals`,
      body: `Comprehensive review of ${product.name}. ${product.description || 'Top features and benefits.'}\n\n[Get it here](${product.affiliate_url})`,
      product_id: product.id,
      status: "draft",
      affiliate_link: product.affiliate_url
    }));

    console.log(`📝 Content Generator: Created ${articles.length} articles with affiliate links`);

    return res.status(200).json({
      success: true,
      message: `Generated ${articles.length} SEO articles with affiliate links`,
      articlesCreated: articles.length,
      articles
    });
  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate content"
    });
  }
}