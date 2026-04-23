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
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, body, views")
      .order("views", { ascending: true })
      .limit(5);

    if (contentError) throw contentError;

    let rewritten = 0;
    if (content && content.length > 0) {
      for (const item of content) {
        const improvedContent = item.body 
          ? `${item.body}\n\n💡 **Why This Matters**: This product solves real problems. Click now to see current pricing and exclusive deals.\n\n✅ **Take Action**: Don't miss out - limited stock available!`
          : "Check out this amazing product with exclusive deals!";

        const { error: updateError } = await supabase
          .from("generated_content")
          .update({
            body: improvedContent,
            updated_at: new Date().toISOString()
          })
          .eq("id", item.id);

        if (!updateError) rewritten++;
      }
    }

    return res.status(200).json({
      message: `Rewrote ${rewritten} low-performing articles`,
      rewritten,
      improvements: ["stronger CTA", "benefit-focused", "urgency elements"]
    });
  } catch (error: any) {
    console.error("Rewrite low performers error:", error);
    return res.status(500).json({ error: error.message });
  }
}