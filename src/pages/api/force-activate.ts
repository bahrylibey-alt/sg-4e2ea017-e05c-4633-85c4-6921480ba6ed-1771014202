import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * FORCE ACTIVATE - Turn on autopilot for user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Enable autopilot in settings
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      autopilot_enabled: true,
      updated_at: new Date().toISOString()
    });

    // Set system state to running
    await supabase.from('system_state').upsert({
      user_id: user.id,
      state: 'RUNNING',
      total_views: 0,
      total_clicks: 0,
      updated_at: new Date().toISOString()
    });

    console.log('[Force Activate] Autopilot activated for user:', user.id);

    return res.status(200).json({
      success: true,
      message: 'Autopilot activated! System is now running.',
      user_id: user.id
    });

  } catch (error: any) {
    console.error('[Force Activate] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}