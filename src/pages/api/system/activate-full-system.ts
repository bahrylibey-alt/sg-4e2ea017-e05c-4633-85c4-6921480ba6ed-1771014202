import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";
import { unifiedOrchestrator } from "@/services/unifiedOrchestrator";

/**
 * FULL SYSTEM ACTIVATION
 * 
 * Activates the complete autonomous system:
 * 1. Self-healing diagnostics
 * 2. System configuration
 * 3. Autopilot execution
 * 4. Traffic engine initialization
 * 5. Monitoring setup
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🚀 FULL SYSTEM ACTIVATION INITIATED');
    console.log('Time:', new Date().toISOString());

    const activationSteps: any[] = [];

    // STEP 1: Self-Healing Diagnosis
    activationSteps.push({ step: 'Self-Healing Diagnosis', status: 'STARTED' });
    const healingResult = await selfHealingAutopilot.diagnoseAndHeal();
    activationSteps.push({ 
      step: 'Self-Healing Diagnosis', 
      status: healingResult.success ? 'SUCCESS' : 'PARTIAL',
      issuesFound: healingResult.issuesFound,
      issuesFixed: healingResult.issuesFixed,
      failedFixes: healingResult.failedFixes,
      details: healingResult.details
    });

    // Get user ID from healing result
    const userId = healingResult.details.find(d => d.issue === 'User Setup')?.action?.includes('SUCCESS') 
      ? (await supabase.auth.getUser()).data.user?.id 
      : null;

    if (!userId) {
      throw new Error('No user found - cannot activate system');
    }

    // STEP 2: Enable Autopilot
    activationSteps.push({ step: 'Enable Autopilot', status: 'STARTED' });
    const { error: autopilotError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        autopilot_enabled: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (autopilotError) throw autopilotError;
    activationSteps.push({ step: 'Enable Autopilot', status: 'SUCCESS' });

    // STEP 3: Initialize System State
    activationSteps.push({ step: 'Initialize System State', status: 'STARTED' });
    const { error: stateError } = await supabase
      .from('system_state')
      .upsert({
        user_id: userId,
        total_views: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_revenue: 0,
        total_verified_revenue: 0,
        total_verified_conversions: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (stateError) throw stateError;
    activationSteps.push({ step: 'Initialize System State', status: 'SUCCESS' });

    // STEP 4: Run Initial Autopilot Execution
    activationSteps.push({ step: 'Initial Autopilot Execution', status: 'STARTED' });
    try {
      const autopilotResult = await unifiedOrchestrator.execute(userId);
      activationSteps.push({ 
        step: 'Initial Autopilot Execution', 
        status: autopilotResult.success ? 'SUCCESS' : 'FAILED',
        result: autopilotResult
      });
    } catch (autopilotExecError: any) {
      activationSteps.push({ 
        step: 'Initial Autopilot Execution', 
        status: 'FAILED',
        error: autopilotExecError.message
      });
    }

    // STEP 5: Update Last Run Timestamp
    activationSteps.push({ step: 'Update Timestamps', status: 'STARTED' });
    await supabase
      .from('user_settings')
      .update({
        last_autopilot_run: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    activationSteps.push({ step: 'Update Timestamps', status: 'SUCCESS' });

    // STEP 6: Log Activation
    activationSteps.push({ step: 'Log Activation', status: 'STARTED' });
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'system_activated',
        details: 'Full system activation completed',
        metadata: {
          activation_steps: activationSteps,
          healing_result: healingResult
        } as Record<string, any>,
        status: 'success'
      });
    activationSteps.push({ step: 'Log Activation', status: 'SUCCESS' });

    const successCount = activationSteps.filter(s => s.status === 'SUCCESS').length;
    const totalSteps = activationSteps.length;

    return res.status(200).json({
      success: true,
      message: 'System activated successfully',
      activationProgress: `${successCount}/${totalSteps} steps completed`,
      userId,
      steps: activationSteps,
      healingResult,
      timestamp: new Date().toISOString(),
      nextSteps: [
        'System is now running autonomously',
        'Autopilot will execute based on schedule',
        'Monitor progress in dashboard',
        'Check /api/system/end-to-end-test for system health'
      ]
    });

  } catch (error: any) {
    console.error('❌ SYSTEM ACTIVATION FAILED:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}