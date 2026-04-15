import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { unifiedOrchestrator } from "@/services/unifiedOrchestrator";

/**
 * AUTOPILOT CRON JOB
 * Runs every 30 minutes via Vercel Cron
 * 
 * NOW POWERED BY: Unified Orchestrator (7 revolutionary systems)
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
    console.log('🤖 AUTOPILOT CRON: Starting...');

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

    console.log(`Processing ${users.length} users...`);

    const results = [];
    for (const user of users) {
      try {
        console.log(`🎯 Processing user: ${user.user_id}`);
        
        // Run unified orchestrator
        const result = await unifiedOrchestrator.execute(user.user_id);
        
        results.push({
          userId: user.user_id,
          success: result.success,
          metrics: result.metrics,
          health: result.systemHealth
        });

        // Update last run time
        await supabase
          .from('user_settings')
          .update({ 
            last_autopilot_run: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.user_id);

        console.log(`✅ User ${user.user_id}: ${result.success ? 'SUCCESS' : 'PARTIAL'}`);

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
    console.error('❌ AUTOPILOT CRON ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}