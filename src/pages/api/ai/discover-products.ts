import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { OpenAIService } from "@/services/openAIService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { niche, count, use_ai } = req.body;
    
    if (!niche) {
      return res.status(400).json({ error: "Niche is required" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const products = [];

    if (use_ai) {
      // Use AI to discover real trending products
      const apiKey = req.headers['x-openai-key'] as string;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "OpenAI API key required for AI discovery. Add your key in Settings → API Keys" 
        });
      }

      const openai = new OpenAIService(apiKey);

      // Discover trending products using AI
      const aiProducts = await openai.discoverTrendingProducts(niche, count || 5);

      // Save to database with real affiliate URLs
      for (const product of aiProducts) {
        // Create affiliate URLs for Amazon and AliExpress
        const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(product.amazon_search_term)}&tag=yourstore-20`;
        const aliexpressUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.aliexpress_search_term)}&affiliate=youraffid`;

        const { data, error } = await supabase
          .from("product_catalog")
          .insert({
            name: product.name,
            category: product.category,
            description: product.why_trending,
            price: parseFloat(product.price_range.split('-')[1].replace(/[^0-9.]/g, '')) || null,
            affiliate_url: amazonUrl, // Primary affiliate URL
            status: "active",
            ai_generated: true,
            trend_score: product.trend_score,
            target_audience: product.target_audience,
            network: "Amazon",
            metadata: {
              why_trending: product.why_trending,
              current_trend_data: product.current_trend_data,
              amazon_url: amazonUrl,
              aliexpress_url: aliexpressUrl,
              price_range: product.price_range,
              affiliate_potential: product.affiliate_potential,
              discovered_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (!error && data) {
          products.push(data);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Discovered ${products.length} trending ${niche} products using AI`,
        products,
        ai_powered: true,
        trend_data: products.map(p => ({
          name: p.name,
          trend_score: p.trend_score,
          why_trending: p.metadata?.why_trending,
          current_data: p.metadata?.current_trend_data
        }))
      });
    } else {
      // Simulated mode - still use realistic current year data
      const currentYear = new Date().getFullYear();
      
      const simulatedProducts = [
        {
          name: `AI-Powered Smart ${niche} Hub ${currentYear}`,
          category: niche,
          description: `Featured at CES ${currentYear}, AI integration trending on TikTok with 45M+ views`,
          price: 129.99,
          affiliate_url: `https://www.amazon.com/s?k=ai+smart+${niche.toLowerCase()}+${currentYear}&tag=yourstore-20`,
          network: "Amazon",
          trend_score: 92,
          status: "active"
        },
        {
          name: `Ultra Premium ${niche} Pro ${currentYear} Edition`,
          category: niche,
          description: `Viral on Instagram Reels (15M views), influencer-endorsed in ${currentYear}`,
          price: 199.99,
          affiliate_url: `https://www.aliexpress.com/wholesale?SearchText=premium+${niche.toLowerCase()}&affiliate=youraffid`,
          network: "AliExpress",
          trend_score: 88,
          status: "active"
        },
        {
          name: `Eco-Friendly Sustainable ${niche} ${currentYear}`,
          category: niche,
          description: `Earth Day ${currentYear} trend, carbon-neutral certification trending`,
          price: 69.99,
          affiliate_url: `https://www.amazon.com/s?k=eco+friendly+${niche.toLowerCase()}&tag=yourstore-20`,
          network: "Amazon",
          trend_score: 85,
          status: "active"
        }
      ];

      for (const product of simulatedProducts.slice(0, count || 3)) {
        const { data, error } = await supabase
          .from("product_catalog")
          .insert({
            ...product,
            ai_generated: false,
            target_audience: "General consumers",
            metadata: {
              simulated: true,
              discovered_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (!error && data) {
          products.push(data);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Discovered ${products.length} products (simulated mode)`,
        products,
        ai_powered: false,
        note: "Enable AI mode by adding your OpenAI API key in Settings"
      });
    }
  } catch (error: unknown) {
    console.error("AI product discovery error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to discover products",
      details: error instanceof Error ? error.stack : undefined
    });
  }
}