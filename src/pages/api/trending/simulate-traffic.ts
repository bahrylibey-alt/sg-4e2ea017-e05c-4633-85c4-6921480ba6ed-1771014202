import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/**
 * TRAFFIC SIMULATION ENGINE
 * Simulates realistic traffic patterns for testing
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { productCount = 5, clicksPerProduct = 100 } = req.query;

    // Get random products
    const { data: products } = await supabase
      .from('affiliate_links')
      .select('id, slug, product_name, network, clicks')
      .eq('status', 'active')
      .limit(Number(productCount));

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No products found'
      });
    }

    const results = [];

    for (const product of products) {
      // Simulate realistic traffic distribution
      const newClicks = Math.floor(Math.random() * Number(clicksPerProduct)) + 50;
      const conversions = Math.floor(newClicks * 0.03); // 3% conversion rate
      
      // Update product clicks
      const { error } = await supabase
        .from('affiliate_links')
        .update({ 
          clicks: (product.clicks || 0) + newClicks 
        })
        .eq('id', product.id);

      if (!error) {
        results.push({
          product: product.product_name,
          network: product.network,
          new_clicks: newClicks,
          total_clicks: (product.clicks || 0) + newClicks,
          estimated_conversions: conversions,
          estimated_revenue: (conversions * 50).toFixed(2) // Avg $50 per sale
        });
      }
    }

    // Update content clicks proportionally
    await supabase.rpc('update_content_clicks');

    return res.status(200).json({
      success: true,
      message: `Simulated traffic for ${products.length} products`,
      results,
      summary: {
        total_clicks: results.reduce((sum, r) => sum + r.new_clicks, 0),
        total_conversions: results.reduce((sum, r) => sum + r.estimated_conversions, 0),
        total_revenue: '$' + results.reduce((sum, r) => sum + Number(r.estimated_revenue), 0).toFixed(2)
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}