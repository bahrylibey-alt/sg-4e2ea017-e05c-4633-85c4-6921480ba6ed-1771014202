import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { magicTrafficEngine } from "@/services/magicTrafficEngine";

/**
 * AUTO-DISTRIBUTE TRAFFIC API
 * Automatically activates best traffic sources for a user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, auto_discover = true, limit = 12 } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId is required' 
      });
    }

    console.log(`🚀 Auto-distributing traffic for user: ${userId}`);

    // Verify user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Auto-activate best sources
    const result = await magicTrafficEngine.autoActivateBestSources(
      userId, 
      limit,
      supabase
    );

    console.log(`✅ Successfully activated ${result.activated} traffic sources`);

    return res.status(200).json({
      success: true,
      activated: result.activated,
      distributed_to: result.activated,
      sources: result.sources,
      total_potential_traffic: result.total_potential_traffic,
      message: `Successfully activated ${result.activated} traffic sources`
    });

  } catch (error: any) {
    console.error('Auto-distribute error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-distribute traffic'
    });
  }
}