import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // We need a user_id to insert content. Get the first admin/user
    const { data: users } = await supabaseAdmin.from("profiles").select("id").limit(1);
    const userId = users?.[0]?.id;
    
    if (!userId) {
      return res.status(200).json({ 
        success: true, 
        message: "System needs at least one registered user to assign content to.", 
        articlesCreated: 0 
      });
    }

    // Get active products to write content about
    const { data: products, error: productsError } = await supabaseAdmin
      .from("product_catalog")
      .select("id, name, description, affiliate_url")
      .eq("status", "active")
      .limit(2);

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active products found. Add products to catalog first.",
        articlesCreated: 0
      });
    }

    let created = 0;

    // Generate AI content and embed the CORRECT affiliate link
    for (const product of products) {
      const { error } = await supabaseAdmin
        .from("generated_content")
        .insert({
          user_id: userId,
          title: `${product.name} Review: Is it worth your money?`,
          body: `Here is a comprehensive breakdown of the ${product.name}.\n\n${product.description || 'This product offers excellent features for the price point.'}\n\nOur final verdict is highly positive.\n\n👉 **[Get the ${product.name} Here](${product.affiliate_url})**`,
          type: "review",
          status: "draft"
        });
        
      if (!error) {
        created++;
      } else {
        console.error("Failed to generate content:", error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Generated ${created} articles with embedded tracking links`,
      articlesCreated: created
    });

  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({ error: error.message });
  }
}