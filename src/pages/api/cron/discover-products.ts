import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * Vercel Cron Job: Daily Product Discovery
 * Runs at 2 AM UTC daily via vercel.json configuration
 * Discovers trending products from Amazon, Temu, AliExpress
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕐 CRON JOB: Daily Product Discovery Started');
    console.log('Time:', new Date().toISOString());

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get all active users
    const { data: users } = await supabaseAdmin
      .from('user_settings')
      .select('user_id')
      .limit(100);

    if (!users || users.length === 0) {
      console.log('⚠️ No users found, using default user');
      // Use first affiliate link user as fallback
      const { data: links } = await supabaseAdmin
        .from('affiliate_links')
        .select('user_id')
        .limit(1);
      
      if (links && links.length > 0) {
        users.push({ user_id: links[0].user_id });
      }
    }

    const results = [];

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.user_id}`);
      
      try {
        // Discover products from ALL networks
        const discoveryResult = await smartProductDiscovery.discoverProducts(
          user.user_id,
          { 
            limit: 50,
            networks: ['Amazon', 'Temu', 'AliExpress'],
            supabaseClient: supabaseAdmin
          }
        );
        
        console.log(`   Discovered: ${discoveryResult.totalDiscovered} products`);
        console.log(`   By Network:`, discoveryResult.byNetwork);
        
        // Auto-publish trending products
        const publishResult = await smartProductDiscovery.publishTrendingProducts(
          user.user_id, 
          10, 
          supabaseAdmin
        );
        
        console.log(`   Published: ${publishResult.published} new articles`);
        
        results.push({
          user_id: user.user_id,
          discovered: discoveryResult.totalDiscovered,
          published: publishResult.published,
          networks: discoveryResult.byNetwork
        });
        
      } catch (error: any) {
        console.error(`   ❌ Error for user ${user.user_id}:`, error.message);
        results.push({
          user_id: user.user_id,
          error: error.message
        });
      }
    }

    console.log('\n✅ CRON JOB COMPLETED');
    console.log('Results:', results);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      users_processed: users.length,
      results
    });

  } catch (error: any) {
    console.error('❌ CRON JOB FAILED:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}