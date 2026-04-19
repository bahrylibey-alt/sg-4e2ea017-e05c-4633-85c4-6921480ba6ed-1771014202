import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * RUN PRODUCT DISCOVERY MANUALLY
 * 
 * Discovers products from connected affiliate networks
 * REAL DATA ONLY - No mock products
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const userId = req.query.userId as string || req.body?.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId required',
        example: '/api/run-product-discovery?userId=YOUR_USER_ID'
      });
    }

    console.log('🔍 Starting product discovery for user:', userId);

    // Get autopilot settings
    const { data: settings } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const discoverySettings = {
      limit: 50,
      minPrice: settings?.min_product_price || undefined,
      maxPrice: settings?.max_product_price || undefined
    };

    // Run discovery
    const result = await smartProductDiscovery.discoverProducts(userId, discoverySettings);

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'product_discovery_manual',
        details: `Discovered ${result.totalDiscovered} products`,
        metadata: result as any,
        status: result.totalDiscovered > 0 ? 'success' : 'warning'
      });

    return res.status(200).json({
      success: result.totalDiscovered > 0,
      message: result.totalDiscovered > 0 
        ? `Discovered ${result.totalDiscovered} products from ${Object.keys(result.byNetwork).length} networks`
        : 'No products discovered',
      result,
      next_steps: result.totalDiscovered > 0
        ? [
            'Products added to your catalog',
            'Check them in your dashboard',
            'Autopilot will analyze and promote them automatically'
          ]
        : result.recommendations
    });

  } catch (error: any) {
    console.error('❌ Discovery error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}