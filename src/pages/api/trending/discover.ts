import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/**
 * TRENDING PRODUCTS DISCOVERY ENGINE
 * Simulates real-time product discovery with traffic metrics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active products
    const { data: products } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('status', 'active')
      .order('clicks', { ascending: false });

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No products found. Run product discovery first.',
        action: 'POST /api/trending/seed'
      });
    }

    // Calculate trending score based on recent activity
    const trendingProducts = products.map(p => ({
      ...p,
      trending_score: (p.clicks || 0) * (p.commission_rate || 0) / 10,
      estimated_revenue: ((p.clicks || 0) * 0.03 * (p.commission_rate || 0)).toFixed(2), // 3% conversion rate
      status: p.clicks > 1000 ? '🔥 HOT' : p.clicks > 500 ? '📈 RISING' : '⭐ NEW'
    })).sort((a, b) => b.trending_score - a.trending_score);

    // Network breakdown
    const networkStats = products.reduce((acc, p) => {
      const net = p.network || 'Unknown';
      acc[net] = {
        products: (acc[net]?.products || 0) + 1,
        total_clicks: (acc[net]?.total_clicks || 0) + (p.clicks || 0),
        avg_commission: ((acc[net]?.avg_commission || 0) + (p.commission_rate || 0)) / ((acc[net]?.products || 0) + 1)
      };
      return acc;
    }, {} as Record<string, any>);

    return res.status(200).json({
      success: true,
      summary: {
        total_products: products.length,
        total_clicks: products.reduce((sum, p) => sum + (p.clicks || 0), 0),
        estimated_revenue: products.reduce((sum, p) => 
          sum + (p.clicks || 0) * 0.03 * (p.commission_rate || 0) / 100, 0
        ).toFixed(2)
      },
      networks: networkStats,
      trending: trendingProducts.slice(0, 10)
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}