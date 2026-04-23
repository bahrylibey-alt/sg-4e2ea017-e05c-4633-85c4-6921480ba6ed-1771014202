import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Find REAL low-performing content (no auth required)
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, body, views, clicks")
      .eq("status", "published")
      .order("views", { ascending: true })
      .limit(5);

    if (contentError) throw contentError;

    if (!content || content.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No content found to rewrite",
        rewritten: 0
      });
    }

    // Filter truly low performers (less than 20 views)
    const lowPerformers = content.filter(c => 
      (c.views || 0) < 20
    );

    let rewritten = 0;

    // Mark for improvement (don't actually change content without AI)
    for (const item of lowPerformers) {
      await supabase
        .from("generated_content")
        .update({ 
          status: "needs_improvement",
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      rewritten++;
    }

    console.log(`🔄 Rewrite: Flagged ${rewritten} low performers for improvement`);

    return res.status(200).json({
      success: true,
      message: `Flagged ${rewritten} articles for rewrite`,
      rewritten,
      details: lowPerformers.map(c => ({
        id: c.id,
        title: c.title,
        views: c.views || 0
      }))
    });

  } catch (error: any) {
    console.error("Rewrite low performers error:", error);
    return res.status(500).json({ error: error.message });
  }
}