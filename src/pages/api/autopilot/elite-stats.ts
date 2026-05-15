import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { eliteAutopilotEngine } from "@/services/eliteAutopilotEngine";

/**
 * GET Elite Autopilot Stats
 * Returns current stats for the Elite system
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
    let targetUserId: string;

    // If no userId provided or it's an array, get first available profile
    if (!userId || typeof userId !== 'string') {
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id')
        .limit(1);

      if (!profiles || profiles.length === 0) {
        return res.status(200).json({
          products: 0,
          bridgePages: 0,
          leads: 0,
          emailSequences: 0,
          posts: 0,
          phase: 'NO_USER',
          message: 'No user profile found'
        });
      }

      targetUserId = profiles[0].id;
    } else {
      targetUserId = userId;
    }

    const stats = await eliteAutopilotEngine.getEliteStats(targetUserId);

    return res.status(200).json(stats);

  } catch (error) {
    console.error('Elite stats error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      products: 0,
      bridgePages: 0,
      leads: 0,
      emailSequences: 0,
      posts: 0,
      phase: 'ERROR'
    });
  }
}