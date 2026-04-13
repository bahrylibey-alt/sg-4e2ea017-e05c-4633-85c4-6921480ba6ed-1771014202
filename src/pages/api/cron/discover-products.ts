import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { smartProductDiscovery } from '@/services/smartProductDiscovery';

/**
 * CRON JOB: Product Discovery
 * Runs daily to discover new products from connected affiliate networks
 * Trigger via: Vercel Cron or manual API call
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🔄 CRON: Product Discovery Starting...');

    // Verify cron secret (optional - for security)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all users with connected affiliate integrations
    const { data: users, error: usersError } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('category', 'affiliate_network')
      .eq('status', 'connected');

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      console.log('⚠️ No users with affiliate integrations found');
      return res.status(200).json({ 
        success: true, 
        message: 'No users to process',
        usersProcessed: 0 
      });
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(users.map(u => u.user_id))];
    console.log(`📊 Found ${uniqueUserIds.length} users with affiliate integrations`);

    const results = [];

    for (const userId of uniqueUserIds) {
      try {
        console.log(`🔍 Discovering products for user: ${userId}`);

        const result = await smartProductDiscovery.discoverProducts(userId, 20);

        results.push({
          userId,
          success: true,
          discovered: result.discovered,
          networks: result.networks,
        });

        console.log(`✅ User ${userId}: Discovered ${result.discovered} products from ${result.networks.join(', ')}`);
      } catch (error: any) {
        console.error(`❌ Failed for user ${userId}:`, error);
        results.push({
          userId,
          success: false,
          error: error.message,
        });
      }
    }

    const totalDiscovered = results.reduce((sum, r) => sum + (r.discovered || 0), 0);
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ CRON: Product Discovery Complete`);
    console.log(`📊 ${successCount}/${uniqueUserIds.length} users processed`);
    console.log(`📦 ${totalDiscovered} total products discovered`);

    return res.status(200).json({
      success: true,
      usersProcessed: uniqueUserIds.length,
      successCount,
      totalDiscovered,
      results,
    });

  } catch (error: any) {
    console.error('❌ CRON: Product Discovery Failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}