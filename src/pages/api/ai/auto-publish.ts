import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { OpenAIService } from "@/services/openAIService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { content_id } = req.body;

    if (!content_id) {
      return res.status(400).json({ error: "content_id is required" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get content
    const { data: content } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", content_id)
      .single();

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    const affiliateLink = content.product_link || "";

    const openai = new OpenAIService(process.env.OPENAI_API_KEY);

    // Step 2: Generate unique social posts tailored to each platform
    const socialPosts = await openai.generateSocialPosts(
      content.title,
      content.category || "General",
      content.body || "",
      affiliateLink
    );

    // Save social posts to database
    const savedPosts = [];
    for (const post of socialPosts) {
      const { data } = await supabase
        .from("posted_content")
        .insert({
          content_id,
          platform: post.platform,
          post_content: post.content,
          post_title: post.title,
          hashtags: post.hashtags,
          status: "scheduled",
          affiliate_link: affiliateLink
        })
        .select()
        .single();

      if (data) {
        savedPosts.push(data);
      }
    }

    // Mark content as published
    await supabase
      .from("generated_content")
      .update({ status: "published" })
      .eq("id", content_id);

    return res.status(200).json({
      success: true,
      message: `Created ${savedPosts.length} social posts`,
      posts: savedPosts
    });
  } catch (error: unknown) {
    console.error("Auto publish error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to publish" 
    });
  }
}