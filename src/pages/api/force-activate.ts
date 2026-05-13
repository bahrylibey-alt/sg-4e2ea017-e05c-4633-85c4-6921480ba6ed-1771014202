import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * FORCE ACTIVATE ENDPOINT
 * Activates the autopilot system
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    let userId = '00000000-0000-0000-0000-000000000000';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Activate system
    await supabase.from('system_state').upsert({
      user_id: userId,
      state: 'RUNNING',
      total_views: 0,
      total_clicks: 0,
      updated_at: new Date().toISOString()
    });

    await supabase.from('user_settings').upsert({
      user_id: userId,
      autopilot_enabled: true,
      updated_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Autopilot activated'
    });
  } catch (error: any) {
    console.error('[Force Activate] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}