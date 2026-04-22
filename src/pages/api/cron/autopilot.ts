import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { unifiedOrchestrator } from "@/services/unifiedOrchestrator";

/**
 * AUTOPILOT CRON JOB
 * 
 * Runs daily to:
 * 1. Check if autopilot is enabled
 * 2. Execute unified orchestrator
 * 3. Update last run timestamp
 * 
 * Vercel Cron: Runs automatically based on vercel.json schedule
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🤖 AUTOPILOT CRON JOB STARTING...');
    console.log('Time:', new Date().toISOString());

    // Get all users with autopilot enabled
    const { data: users } = await supabase
      .from('user_settings')
      .select('user_id, autopilot_enabled')
      .eq('autopilot_enabled', true);

    if (!users || users.length === 0) {
      console.log('⏸️  No users with autopilot enabled');
      return res.status(200).json({
        success: true,
        message: 'No users with autopilot enabled',
        processed: 0
      });
    }

    console.log(`📊 Found ${users.length} user(s) with autopilot enabled`);

    const results = [];

    for (const { user_id } of users) {
      console.log(`\n🎯 Processing user: ${user_id}`);
      
      try {
        // Execute unified orchestrator
        const result = await unifiedOrchestrator.execute(user_id);

        // Update last run timestamp
        await supabase
          .from('user_settings')
          .update({
            last_autopilot_run: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);

        results.push({
          user_id,
          success: result.success,
          message: result.success ? 'Autopilot executed' : 'Execution failed'
        });

        console.log(`✅ User ${user_id}: ${result.success ? 'Success' : 'Failed'}`);

      } catch (userError: any) {
        console.error(`❌ Error processing user ${user_id}:`, userError);
        results.push({
          user_id,
          success: false,
          error: userError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎉 AUTOPILOT CRON COMPLETE: ${successCount}/${users.length} successful`);

    return res.status(200).json({
      success: true,
      message: `Processed ${users.length} user(s)`,
      results,
      stats: {
        total: users.length,
        successful: successCount,
        failed: users.length - successCount
      }
    });

  } catch (error: any) {
    console.error('❌ AUTOPILOT CRON ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}