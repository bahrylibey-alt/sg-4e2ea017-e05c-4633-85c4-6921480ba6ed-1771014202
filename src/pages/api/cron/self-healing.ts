import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * SELF-HEALING CRON JOB
 * 
 * Runs every 6 hours to maintain system health
 * - Checks for stale content
 * - Republishes failed posts
 * - Discovers new products if needed
 * - Ensures continuous posting
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔧 SELF-HEALING CRON STARTED');
  
  try {
    const { data: users } = await (supabase as any)
      .from('profiles')
      .select('id')
      .limit(10);

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users to process'
      });
    }

    const results = [];

    for (const user of users) {
      try {
        // Check if there's content ready to post
        const { count: readyContent } = await (supabase as any)
          .from('generated_content')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'draft');

        // If less than 10 pieces of content, run autopilot
        if (!readyContent || readyContent < 10) {
          console.log(`Running autopilot for user ${user.id} (low content)`);
          
          const result = await selfHealingAutopilot.executeFullCycle({
            userId: user.id,
            maxProducts: 10,
            maxContentPerProduct: 5
          });

          results.push({
            userId: user.id,
            action: 'autopilot_executed',
            success: result.success,
            summary: result.summary
          });
        } else {
          results.push({
            userId: user.id,
            action: 'content_sufficient',
            readyContent
          });
        }
      } catch (error) {
        console.error(`Self-healing error for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          action: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Self-healing cron error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}