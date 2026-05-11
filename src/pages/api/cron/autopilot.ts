import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * AUTONOMOUS AUTOPILOT CRON JOB
 * 
 * Runs automatically every hour via Vercel Cron
 * Can also be called manually (no auth required for manual triggers)
 * Executes for ALL users in the system
 * 
 * Flow:
 * 1. Discover 10-15 trending products
 * 2. Create affiliate links
 * 3. Generate AI content (with template fallback)
 * 4. Post to ALL platforms automatically
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret ONLY if it's set (for production Vercel cron)
  // Allow manual/internal calls without auth
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Invalid authorization' });
  }

  console.log('🤖 AUTOPILOT CRON JOB STARTED');
  
  try {
    // Get all active users
    const { data: users, error: usersError } = await (supabase as any)
      .from('profiles')
      .select('id, email')
      .limit(10);

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users to process',
        executedAt: new Date().toISOString()
      });
    }

    console.log(`Found ${users.length} users to process`);

    const results = [];

    // Execute for each user
    for (const user of users) {
      try {
        console.log(`Executing autopilot for user ${user.email}...`);
        
        const result = await selfHealingAutopilot.executeFullCycle({
          userId: user.id,
          maxProducts: 15,
          maxContentPerProduct: 5,
          platforms: ['pinterest', 'reddit', 'medium', 'twitter', 'facebook', 'linkedin', 'tumblr', 'instagram']
        });

        results.push({
          userId: user.id,
          email: user.email,
          success: result.success,
          summary: result.summary
        });

        console.log(`✅ Completed for ${user.email}: ${JSON.stringify(result.summary)}`);
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Autopilot executed for ${users.length} users`,
      results,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executedAt: new Date().toISOString()
    });
  }
}