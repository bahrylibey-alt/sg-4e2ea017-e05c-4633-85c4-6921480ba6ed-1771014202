import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { unifiedOrchestrator } from "@/services/unifiedOrchestrator";

/**
 * FORCE AUTOPILOT RUN
 * 
 * Manually trigger autopilot execution for testing/debugging
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 FORCE AUTOPILOT RUN: Starting...');

    // Get all users with autopilot enabled
    const { data: users, error: usersError } = await supabase
      .from('user_settings')
      .select('user_id, autopilot_enabled')
      .eq('autopilot_enabled', true);

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No users with autopilot enabled',
        action: 'Enable autopilot in settings first'
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
          health: result.systemHealth,
          executedSystems: result.executedSystems || []
        });

        // Update last run time
        await supabase
          .from('user_settings')
          .update({ 
            last_autopilot_run: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.user_id);

        // Log execution
        await supabase
          .from('autopilot_cron_log')
          .insert({
            user_id: user.user_id,
            execution_time: new Date().toISOString(),
            status: result.success ? 'success' : 'partial',
            results: result
          });

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
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ FORCE AUTOPILOT ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}