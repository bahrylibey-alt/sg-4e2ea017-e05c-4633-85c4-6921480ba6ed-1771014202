import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find REAL low-performing content
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, content, view_count, click_count")
      .eq("user_id", user.id)
      .eq("status", "published")
      .order("view_count", { ascending: true })
      .limit(5);

    if (contentError) throw contentError;

    if (!content || content.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No content found to rewrite",
        rewritten: 0
      });
    }

    // Filter truly low performers (less than 20 views after 7+ days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const lowPerformers = content.filter(c => 
      (c.view_count || 0) < 20
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
        views: c.view_count || 0
      }))
    });

  } catch (error: any) {
    console.error("Rewrite low performers error:", error);
    return res.status(500).json({ error: error.message });
  }
}