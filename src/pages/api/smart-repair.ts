import type { NextApiRequest, NextApiResponse } from "next";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * SMART REPAIR SYSTEM
 * 
 * Automatically detects and fixes ALL system issues via the self-healing engine
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 SMART REPAIR: Starting comprehensive system repair...');

    // Run the self-healing autopilot
    const result = await selfHealingAutopilot.diagnoseAndHeal();

    const allGood = result.issuesFound === 0;
    const allFixed = result.issuesFixed === result.issuesFound;
    const someFailed = result.failedFixes > 0;

    return res.status(200).json({
      success: result.success,
      message: allGood
        ? '✅ System is healthy - no repairs needed'
        : allFixed
        ? `✅ Fixed all ${result.issuesFixed} issue(s) - system ready!`
        : `⚠️ Fixed ${result.issuesFixed}/${result.issuesFound}, but ${result.failedFixes} repairs failed`,
      repairs: result.details,
      summary: {
        total: result.issuesFound,
        fixed: result.issuesFixed,
        failed: result.failedFixes,
        already_ok: Math.max(0, result.details.length - result.issuesFound)
      },
      next_action: allGood || allFixed
        ? 'Click "Force Restart Now" to start the automation engine'
        : result.details.find(d => d.status === 'FAILED')?.action || 'Review failed repairs above'
    });

  } catch (error: any) {
    console.error('❌ SMART REPAIR ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      repairs: [],
      summary: {
        total: 0,
        fixed: 0,
        failed: 1
      }
    });
  }
}