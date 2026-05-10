import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * CRON JOB: Autonomous Autopilot Execution
 * 
 * This endpoint should be called every hour by Vercel Cron or external scheduler
 * 
 * Vercel cron.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/autopilot",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🤖 CRON: Autopilot execution triggered');

  try {
    // Get all users with autopilot enabled
    const { data: users } = await (supabase as any)
      .from('profiles')
      .select('id')
      .limit(10);

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users found',
        executed: 0
      });
    }

    const results = [];

    for (const user of users) {
      try {
        console.log(`Executing autopilot for user ${user.id}`);
        
        const result = await selfHealingAutopilot.executeFullCycle({
          userId: user.id,
          maxProducts: 10,
          maxContentPerProduct: 3,
          platforms: ['pinterest', 'reddit', 'medium', 'twitter', 'facebook']
        });

        results.push({
          userId: user.id,
          success: result.success,
          summary: result.summary
        });

      } catch (error) {
        console.error(`Autopilot failed for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Autopilot cron completed: ${successCount}/${users.length} successful`);

    return res.status(200).json({
      success: true,
      message: `Executed autopilot for ${users.length} users`,
      successCount,
      totalUsers: users.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron autopilot error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Vercel Cron auth check (optional)
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }
}