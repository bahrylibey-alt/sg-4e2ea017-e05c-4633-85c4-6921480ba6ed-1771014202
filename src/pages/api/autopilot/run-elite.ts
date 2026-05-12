import type { NextApiRequest, NextApiResponse } from "next";
import { eliteAutopilotEngine } from "@/services/eliteAutopilotEngine";

/**
 * Run Elite Autopilot Workflow
 * Most advanced affiliate system execution
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    console.log('🚀 ELITE WORKFLOW INITIATED');

    const result = await eliteAutopilotEngine.executeEliteWorkflow({
      userId,
      productLimit: 10,
      platforms: ['pinterest', 'tiktok', 'instagram', 'twitter', 'facebook'],
      enableEmailCapture: true,
      enableRetargeting: true,
      enableViralLoops: true,
      autoOptimize: true
    });

    console.log('✅ ELITE WORKFLOW COMPLETE:', result);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Elite workflow error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}