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

    // Get REAL draft content ready to publish
    const { data: drafts, error: draftError } = await supabase
      .from("generated_content")
      .select("id, title, body, status")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .limit(5);

    if (draftError) throw draftError;

    if (!drafts || drafts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No draft content ready to publish",
        published: 0
      });
    }

    let published = 0;

    // Publish draft content
    for (const item of drafts) {
      const { error: updateError } = await supabase
        .from("generated_content")
        .update({ 
          status: "published",
          updated_at: new Date().toISOString() // Assuming published_at might not exist, using updated_at
        })
        .eq("id", item.id);

      if (!updateError) {
        published++;
        console.log(`✅ Published: ${item.title}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Published ${published} draft articles`,
      published
    });

  } catch (error: any) {
    console.error("Auto publish error:", error);
    return res.status(500).json({ error: error.message });
  }
}