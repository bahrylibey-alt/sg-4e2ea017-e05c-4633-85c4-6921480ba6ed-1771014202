import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .is("content_generated", false)
      .limit(5);

    if (error) throw error;

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products pending content generation",
        articlesCreated: 0
      });
    }

    const articlesCreated = [];

    for (const product of products) {
      const prompt = `Write a compelling SEO-optimized article about "${product.name}". 
Include: benefits, features, why it's trending, and call-to-action. 
Target keywords: ${product.name}, ${product.category || "trending product"}. 
Tone: engaging, informative, persuasive. Length: 500-700 words.`;

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
              content: "You are an expert SEO content writer for affiliate marketing."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!openaiResponse.ok) {
        console.error("OpenAI error:", await openaiResponse.text());
        continue;
      }

      const aiResult = await openaiResponse.json();
      const content = aiResult.choices[0].message.content;

      const { data: article, error: insertError } = await supabase
        .from("generated_content")
        .insert({
          product_id: product.id,
          title: `${product.name}: The Ultimate Guide`,
          content,
          seo_optimized: true,
          status: "ready"
        })
        .select()
        .single();

      if (!insertError) {
        await supabase
          .from("products")
          .update({ content_generated: true })
          .eq("id", product.id);

        articlesCreated.push(article);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Generated ${articlesCreated.length} articles`,
      articlesCreated: articlesCreated.length
    });
  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate content"
    });
  }
}