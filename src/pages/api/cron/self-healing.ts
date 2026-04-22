import type { NextApiRequest, NextApiResponse } from "next";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * SELF-HEALING CRON JOB
 * 
 * Runs every 5 minutes to automatically detect and fix system issues
 * This ensures the system stays healthy even when Vercel crons fail
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🩺 Self-healing cron triggered');

    const result = await selfHealingAutopilot.diagnoseAndHeal();

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error: any) {
    console.error('❌ Self-healing cron error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}