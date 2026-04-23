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
    const { niche } = req.body;

    // Get recent articles for traffic tactics
    const { data: articles, error: articlesError } = await supabase
      .from("generated_content")
      .select("id, title, slug, product_id")
      .order("created_at", { ascending: false })
      .limit(5);

    if (articlesError) throw articlesError;

    if (!articles || articles.length === 0) {
      return res.status(200).json({
        message: "No articles found for traffic boost",
        generated: 0
      });
    }

    // Generate traffic tactics for each article
    const tactics = [];
    for (const article of articles) {
      // Reddit tactic
      const redditTactic = {
        platform: "Reddit",
        article_id: article.id,
        tactic: `Post in r/ProductReviews or r/BuyItForLife with title: "Just discovered this ${article.title} - thoughts?" Include genuine review with affiliate link in comments.`,
        created_at: new Date().toISOString()
      };

      // Quora tactic
      const quoraTactic = {
        platform: "Quora",
        article_id: article.id,
        tactic: `Answer question "What are the best products for [topic]?" Mention ${article.title} with personal experience. Add article link as reference.`,
        created_at: new Date().toISOString()
      };

      // YouTube tactic
      const youtubeTactic = {
        platform: "YouTube",
        article_id: article.id,
        tactic: `Create 60-second Short: "Why ${article.title} is trending" - Show product features, link to full article in description.`,
        created_at: new Date().toISOString()
      };

      tactics.push(redditTactic, quoraTactic, youtubeTactic);
    }

    // Store tactics in database
    const { error: insertError } = await supabase
      .from("traffic_tactics")
      .insert(tactics);

    if (insertError && insertError.code !== "23505") {
      console.error("Traffic tactics insert error:", insertError);
    }

    return res.status(200).json({
      message: `Generated ${tactics.length} traffic tactics for ${articles.length} articles`,
      generated: tactics.length,
      platforms: ["Reddit", "Quora", "YouTube"]
    });

  } catch (error: any) {
    console.error("Traffic boost error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate traffic tactics"
    });
  }
}