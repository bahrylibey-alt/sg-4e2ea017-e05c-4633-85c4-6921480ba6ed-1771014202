import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { OpenAIService } from "@/services/openAIService";
import { getOpenAIKeyFromDB } from "@/lib/getOpenAIKey";

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

    // CRITICAL: Validate link exists before proceeding
    if (!link || !link.slug) {
      return res.status(400).json({ 
        error: "Failed to create affiliate tracking link. Cannot generate content without a valid link." 
      });
    }

    const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/go/${link.slug}`;

    // Double-check tracking URL is valid
    if (!trackingUrl.includes("/go/")) {
      return res.status(400).json({ 
        error: "Invalid tracking URL format. Link must follow /go/{slug} pattern." 
      });
    }

    // Get OpenAI key from database
    const apiKey = await getOpenAIKeyFromDB();
    if (!apiKey) {
      return res.status(400).json({ 
        error: "OpenAI API key not configured. Please add your key in Settings → API Keys" 
      });
    }

    const openai = new OpenAIService(apiKey);

    // Generate SEO-optimized content
    const content = await openai.generateSEOContent(
      product.name,
      product.category || "General",
      product.description || "",
      product.affiliate_url || ""
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