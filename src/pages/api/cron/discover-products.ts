import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * PRODUCT DISCOVERY CRON JOB
 * Runs daily to discover new products from REAL affiliate network APIs
 * 
 * NO FAKE DATA - Only calls real affiliate APIs with valid credentials
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log('🔍 PRODUCT DISCOVERY: Starting...');

    // Get all users with autopilot enabled
    const { data: users } = await supabase
      .from('user_settings')
      .select('user_id, autopilot_enabled')
      .eq('autopilot_enabled', true);

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users with autopilot enabled',
        processed: 0
      });
    }

    console.log(`Discovering products for ${users.length} users...`);

    const results = [];
    for (const user of users) {
      try {
        console.log(`🎯 Processing user: ${user.user_id}`);
        
        // Get user's autopilot settings
        const { data: settings } = await supabase
          .from('autopilot_settings')
          .select('*')
          .eq('user_id', user.user_id)
          .maybeSingle();
        
        // Discover products from REAL affiliate networks only
        const discoveryResult = await smartProductDiscovery.discoverProducts(user.user_id, settings);
        
        results.push({
          userId: user.user_id,
          success: discoveryResult.totalDiscovered > 0,
          discovered: discoveryResult.totalDiscovered,
          byNetwork: discoveryResult.byNetwork,
          recommendations: discoveryResult.recommendations
        });

        console.log(`✅ User ${user.user_id}: Discovered ${discoveryResult.totalDiscovered} products`);

      } catch (userError) {
        console.error(`❌ Error processing user ${user.user_id}:`, userError);
        results.push({
          userId: user.user_id,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${users.length} users`,
      processed: users.length,
      results
    });

  } catch (error: any) {
    console.error('❌ PRODUCT DISCOVERY ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}