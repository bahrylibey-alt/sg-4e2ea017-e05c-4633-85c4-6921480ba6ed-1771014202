import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Cron Job - Runs autopilot every 2 minutes
 * 
 * This API route is called by Vercel Cron (configured in vercel.json)
 * It checks if any user has autopilot enabled and triggers the Edge Function
 * 
 * Runs independently of user's browser - true 24/7 operation
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is being called by Vercel Cron (optional security check)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🤖 Cron: Starting autopilot check...');

  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin access
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users with autopilot enabled
    const { data: users, error: usersError } = await supabase
      .from('user_settings')
      .select('user_id, last_autopilot_run')
      .eq('autopilot_enabled', true);

    if (usersError) {
      console.error('❌ Cron: Error fetching users:', usersError);
      return res.status(500).json({ error: usersError.message });
    }

    if (!users || users.length === 0) {
      console.log('⏸️ Cron: No users with autopilot enabled');
      return res.status(200).json({ message: 'No active autopilot users', executed: 0 });
    }

    console.log(`🎯 Cron: Found ${users.length} user(s) with autopilot enabled`);

    const results = [];

    // Execute autopilot for each user
    for (const user of users) {
      try {
        console.log(`🚀 Cron: Triggering autopilot for user ${user.user_id}`);

        // Call the Edge Function
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: {
            action: 'run_cycle',
            user_id: user.user_id
          }
        });

        if (error) {
          console.error(`❌ Cron: Edge Function error for user ${user.user_id}:`, error);
          results.push({
            user_id: user.user_id,
            success: false,
            error: error.message
          });

          // Log the error
          await supabase.from('autopilot_cron_log').insert({
            user_id: user.user_id,
            status: 'error',
            error: error.message
          });
        } else {
          console.log(`✅ Cron: Autopilot executed successfully for user ${user.user_id}`, data);
          results.push({
            user_id: user.user_id,
            success: true,
            results: data
          });

          // Update last_autopilot_run
          await supabase
            .from('user_settings')
            .update({ last_autopilot_run: new Date().toISOString() })
            .eq('user_id', user.user_id);

          // Log success
          await supabase.from('autopilot_cron_log').insert({
            user_id: user.user_id,
            status: 'success',
            results: data
          });
        }
      } catch (error: any) {
        console.error(`❌ Cron: Unexpected error for user ${user.user_id}:`, error);
        results.push({
          user_id: user.user_id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ Cron: Completed autopilot for ${users.length} user(s)`);

    return res.status(200).json({
      message: 'Autopilot cron executed',
      executed: users.length,
      results
    });

  } catch (error: any) {
    console.error('❌ Cron: Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}