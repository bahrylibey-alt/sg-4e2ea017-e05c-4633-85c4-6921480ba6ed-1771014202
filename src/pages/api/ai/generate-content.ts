import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { OpenAIService } from "@/services/openAIService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get product details
    const { data: product } = await supabase
      .from("product_catalog")
      .select("*")
      .eq("id", product_id)
      .single();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get or create affiliate link
    let { data: link } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("product_id", product_id)
      .single();

    if (!link) {
      const { data: newLink } = await supabase
        .from("affiliate_links")
        .insert({
          product_id,
          original_url: product.affiliate_url,
          slug: `${product.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          platform: "direct"
        })
        .select()
        .single();
      link = newLink;
    }

    const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/go/${link?.slug}`;

    const openai = new OpenAIService(process.env.OPENAI_API_KEY);

    // Generate SEO-optimized content
    const content = await openai.generateSEOContent(
      {
        name: product.name,
        category: product.category || "General",
        target_audience: product.target_audience || "General audience"
      },
      trackingUrl
    );

    // Save to database
    const { data: savedContent, error } = await supabase
      .from("generated_content")
      .insert({
        title: content.title,
        body: content.body,
        meta_description: content.meta_description,
        status: "draft",
        ai_generated: true,
        seo_keywords: content.seo_keywords,
        product_link: trackingUrl
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Content generated successfully",
      content: savedContent
    });
  } catch (error: unknown) {
    console.error("AI content generation error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to generate content" 
    });
  }
}