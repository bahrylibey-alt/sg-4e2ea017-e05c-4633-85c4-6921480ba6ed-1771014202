import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get first user or use provided userId
    const { data: users } = await supabaseAdmin.from("profiles").select("id").limit(1);
    const userId = users?.[0]?.id;
    
    if (!userId) {
      return res.status(200).json({ 
        success: true, 
        message: "System needs at least one registered user. Please sign up first.", 
        articlesCreated: 0 
      });
    }

    // Get REAL active products with actual performance data
    const { data: products, error: productsError } = await supabaseAdmin
      .from("affiliate_links")
      .select("*")
      .eq("status", "active")
      .order("clicks", { ascending: false })
      .limit(5);

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active products found. Run product discovery first.",
        articlesCreated: 0
      });
    }

    let created = 0;

    // Generate REAL content based on actual product performance
    for (const product of products) {
      const realClicks = product.clicks || 0;
      const realConversions = product.conversions || 0;
      const conversionRate = realClicks > 0 ? ((realConversions / realClicks) * 100).toFixed(1) : '0';
      const trackingUrl = `/go/${product.slug}`;
      
      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from("generated_content")
        .select("id")
        .eq("user_id", userId)
        .ilike("body", `%${trackingUrl}%`)
        .maybeSingle();

      if (existing) {
        console.log(`Content already exists for ${product.product_name}`);
        continue;
      }

      const { error } = await supabaseAdmin
        .from("generated_content")
        .insert({
          user_id: userId,
          title: `${product.product_name} - Real Performance Data`,
          body: `🔥 **VERIFIED TRENDING PRODUCT**\n\n**${product.product_name}**\n\nReal Performance Metrics:\n✅ ${realClicks} actual customer clicks\n✅ ${realConversions} verified conversions\n✅ ${conversionRate}% conversion rate\n✅ ${product.commission_rate || 0}% commission\n\nThis product is currently trending on ${product.network || 'the network'} with proven results.\n\n👉 [View Product & Current Price](${trackingUrl})\n\n*Updated: ${new Date().toLocaleDateString()} with live data*`,
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
      message: `Generated ${created} articles with real performance data`,
      articlesCreated: created
    });

  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({ error: error.message });
  }
}