import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * CROSS-NETWORK PRODUCT DISCOVERY CRON JOB
 * Discovers trending products from Amazon, Temu, AliExpress and other networks
 * Auto-publishes trending products as content
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log('🌐 CROSS-NETWORK PRODUCT DISCOVERY: Starting...');

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

    console.log(`Processing ${users.length} users...`);

    const results = [];
    for (const user of users) {
      try {
        console.log(`\n🎯 User: ${user.user_id}`);
        
        // Discover products from ALL networks
        const discoveryResult = await smartProductDiscovery.discoverProducts(
          user.user_id,
          { 
            limit: 50,
            networks: ['Amazon', 'Temu', 'AliExpress', 'Amazon Associates', 'Temu Affiliate']
          }
        );
        
        // Auto-publish trending products
        const publishResult = await smartProductDiscovery.publishTrendingProducts(user.user_id, 5);
        
        results.push({
          userId: user.user_id,
          discovered: discoveryResult.totalDiscovered,
          byNetwork: discoveryResult.byNetwork,
          published: publishResult.published,
          publishedProducts: publishResult.products
        });

        console.log(`✅ User ${user.user_id}:`);
        console.log(`   Discovered: ${discoveryResult.totalDiscovered}`);
        console.log(`   Published: ${publishResult.published}`);

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
    console.error('❌ DISCOVERY ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}