import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Public Autopilot Trigger Endpoint
 * 
 * This endpoint can be called by:
 * 1. External cron services (cron-job.org, EasyCron, etc.)
 * 2. GitHub Actions scheduled workflows
 * 3. Vercel Cron (in production)
 * 4. Direct HTTP GET/POST requests
 * 
 * It checks the database for users with autopilot enabled
 * and triggers the Edge Function to execute the workflow.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🤖 Autopilot Trigger: Incoming request...');

  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Call the database function to execute autopilot
    const { data, error } = await supabase.rpc('execute_autopilot_cycle');

    if (error) {
      console.error('❌ Error executing autopilot:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    console.log('✅ Autopilot triggered:', data);

    return res.status(200).json({
      success: true,
      message: 'Autopilot cycle triggered',
      ...data
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}