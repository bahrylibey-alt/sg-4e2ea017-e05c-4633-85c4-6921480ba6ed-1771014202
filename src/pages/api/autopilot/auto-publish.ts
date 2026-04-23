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

    // Get REAL scheduled content ready to publish
    const now = new Date().toISOString();

    const { data: scheduled, error: scheduledError } = await supabase
      .from("generated_content")
      .select("id, title, content, scheduled_date")
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .lte("scheduled_date", now)
      .limit(5);

    if (scheduledError) throw scheduledError;

    if (!scheduled || scheduled.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No scheduled content ready to publish",
        published: 0
      });
    }

    let published = 0;

    // Publish scheduled content
    for (const item of scheduled) {
      const { error: updateError } = await supabase
        .from("generated_content")
        .update({ 
          status: "published",
          published_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (!updateError) {
        published++;
        console.log(`✅ Published: ${item.title}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Published ${published} scheduled articles`,
      published
    });

  } catch (error: any) {
    console.error("Auto publish error:", error);
    return res.status(500).json({ error: error.message });
  }
}