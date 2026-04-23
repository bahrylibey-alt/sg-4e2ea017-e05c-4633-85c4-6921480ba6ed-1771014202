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
    // Get low-performing content (low CTR)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, content, views, product_id")
      .gte("created_at", thirtyDaysAgo)
      .gt("views", 50)
      .order("views", { ascending: true })
      .limit(5);

    if (contentError) throw contentError;

    if (!content || content.length === 0) {
      return res.status(200).json({
        message: "No low performers found for rewriting",
        rewritten: 0
      });
    }

    // Get clicks to calculate CTR
    const { data: clicks, error: clicksError } = await supabase
      .from("affiliate_clicks")
      .select("content_id")
      .in("content_id", content.map(c => c.id));

    if (clicksError) throw clicksError;

    const clicksByContent = clicks?.reduce((acc: any, click) => {
      acc[click.content_id] = (acc[click.content_id] || 0) + 1;
      return acc;
    }, {}) || {};

    // Find true low performers (views but low clicks)
    const lowPerformers = content.filter(c => {
      const ctr = c.views ? (clicksByContent[c.id] || 0) / c.views : 0;
      return ctr < 0.02; // Less than 2% CTR
    });

    let rewritten = 0;
    for (const item of lowPerformers) {
      // Improve content with stronger CTA and benefits
      const improvedContent = item.content 
        ? `${item.content}\n\n💡 **Why This Matters**: This product solves real problems. Click now to see current pricing and exclusive deals.\n\n✅ **Take Action**: Don't miss out - limited stock available!`
        : "Check out this amazing product with exclusive deals!";

      const { error: updateError } = await supabase
        .from("generated_content")
        .update({
          content: improvedContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (!updateError) {
        rewritten++;
      }
    }

    return res.status(200).json({
      message: `Rewrote ${rewritten} low-performing articles`,
      rewritten,
      improvements: ["stronger CTA", "benefit-focused", "urgency elements"]
    });

  } catch (error: any) {
    console.error("Rewrite low performers error:", error);
    return res.status(500).json({
      error: error.message || "Failed to rewrite low performers"
    });
  }
}