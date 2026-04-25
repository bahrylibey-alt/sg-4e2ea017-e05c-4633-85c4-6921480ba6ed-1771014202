import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { OpenAIService } from "@/services/openAIService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { niche, auto_publish } = req.body;

    if (!niche) {
      return res.status(400).json({ error: "Niche is required" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const openai = new OpenAIService(process.env.OPENAI_API_KEY);
    const results = {
      products_discovered: 0,
      content_generated: 0,
      posts_created: 0,
      errors: [] as string[]
    };

    // Step 1: Discover trending products
    const products = await openai.discoverTrendingProducts(niche, 3);
    
    for (const product of products) {
      try {
        // Save product
        const { data: savedProduct } = await supabase
          .from("product_catalog")
          .insert({
            name: product.name,
            category: product.category,
            description: product.why_trending,
            affiliate_url: `https://example.com/${product.name.toLowerCase().replace(/\s+/g, "-")}`,
            status: "active",
            ai_generated: true,
            trend_score: product.trend_score,
            target_audience: product.target_audience
          })
          .select()
          .single();

        if (!savedProduct) continue;
        results.products_discovered++;

        // Create affiliate link
        const { data: link } = await supabase
          .from("affiliate_links")
          .insert({
            product_id: savedProduct.id,
            original_url: savedProduct.affiliate_url,
            slug: `${savedProduct.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            platform: "direct"
          })
          .select()
          .single();

        if (!link) continue;

        const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/go/${link.slug}`;

        // Step 2: Generate content
        const content = await openai.generateSEOContent(
          product.name,
          product.category || "General",
          product.why_trending || "",
          product.amazon_url || product.aliexpress_url || ""
        );

        const { data: savedContent } = await supabase
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

        if (!savedContent) continue;
        results.content_generated++;

        // Step 3: Auto-publish if requested
        if (auto_publish) {
          const socialPosts = await openai.generateSocialPosts(
            product.name,
            product.category || "General",
            product.why_trending || "",
            product.amazon_url || product.aliexpress_url || ""
          );

          for (const post of socialPosts) {
            const { data } = await supabase
              .from("posted_content")
              .insert({
                content_id: savedContent.id,
                platform: post.platform,
                post_content: post.content,
                post_title: post.title,
                hashtags: post.hashtags,
                status: "scheduled",
                affiliate_link: trackingUrl
              })
              .select()
              .single();

            if (data) {
              results.posts_created++;
            }
          }

          await supabase
            .from("generated_content")
            .update({ status: "published" })
            .eq("id", savedContent.id);
        }

      } catch (error: unknown) {
        results.errors.push(error instanceof Error ? error.message : "Unknown error");
      }
    }

    return res.status(200).json({
      success: true,
      message: "AI workflow completed",
      results
    });
  } catch (error: unknown) {
    console.error("Full workflow error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Workflow failed" 
    });
  }
}