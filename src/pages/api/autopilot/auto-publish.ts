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
    // Get draft content ready for publishing
    const { data: drafts, error: draftsError } = await supabase
      .from("generated_content")
      .select("id, title, slug")
      .eq("status", "draft")
      .order("created_at", { ascending: true })
      .limit(3);

    if (draftsError) throw draftsError;

    if (!drafts || drafts.length === 0) {
      return res.status(200).json({
        message: "No drafts ready for publishing",
        published: 0
      });
    }

    let published = 0;
    for (const draft of drafts) {
      const { error: updateError } = await supabase
        .from("generated_content")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", draft.id);

      if (!updateError) {
        published++;
        console.log(`Published: ${draft.title}`);
      }
    }

    return res.status(200).json({
      message: `Published ${published} articles`,
      published,
      articles: drafts.slice(0, published).map(d => d.title)
    });

  } catch (error: any) {
    console.error("Auto-publish error:", error);
    return res.status(500).json({
      error: error.message || "Failed to auto-publish articles"
    });
  }
}