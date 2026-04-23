import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data: articles, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("status", "ready")
      .is("social_posted", null)
      .limit(3);

    if (error) throw error;

    if (!articles || articles.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No articles pending social posting",
        postsCreated: 0
      });
    }

    const postsCreated = [];

    for (const article of articles) {
      const prompt = `Create 3 viral social media posts for this article: "${article.title}".
Each post should:
- Be platform-specific (Twitter, Facebook, LinkedIn)
- Include hooks, emojis, hashtags
- Drive clicks to the article
- Be under 280 characters for Twitter
Format as JSON: [{"platform": "twitter", "content": "..."}]`;

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a viral social media expert. Return only valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 500
        })
      });

      if (!openaiResponse.ok) {
        console.error("OpenAI error:", await openaiResponse.text());
        continue;
      }

      const aiResult = await openaiResponse.json();
      let posts;
      try {
        posts = JSON.parse(aiResult.choices[0].message.content);
      } catch {
        posts = [
          { platform: "twitter", content: article.title },
          { platform: "facebook", content: article.title },
          { platform: "linkedin", content: article.title }
        ];
      }

      const { error: updateError } = await supabase
        .from("generated_content")
        .update({ 
          social_posted: true,
          social_posts: posts
        })
        .eq("id", article.id);

      if (!updateError) {
        postsCreated.push({ article: article.title, posts });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Created social posts for ${postsCreated.length} articles`,
      postsCreated: postsCreated.length
    });
  } catch (error: any) {
    console.error("Social publisher error:", error);
    return res.status(500).json({
      error: error.message || "Failed to create social posts"
    });
  }
}