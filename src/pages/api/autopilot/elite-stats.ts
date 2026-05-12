import type { NextApiRequest, NextApiResponse } from "next";
import { eliteAutopilotEngine } from "@/services/eliteAutopilotEngine";

/**
 * Get Elite Autopilot Statistics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID required' });
    }

    const stats = await eliteAutopilotEngine.getEliteStats(userId);

    return res.status(200).json(stats);

  } catch (error) {
    console.error('Failed to get elite stats:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}