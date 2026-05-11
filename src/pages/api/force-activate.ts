import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";

/**
 * FORCE ACTIVATE - Immediately kickstart the publishing system
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 FORCE ACTIVATING PUBLISHING SYSTEM');

  try {
    // Get first user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users found. Please sign up first.'
      });
    }

    const user = profiles[0];
    console.log(`Activating for user: ${user.email}`);

    // Execute complete workflow
    const result = await realAutopilotEngine.executeCompleteWorkflow(user.id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Execution failed'
      });
    }

    // Simulate some initial engagement
    const engagement = await realAutopilotEngine.simulateInitialEngagement(user.id);

    // Get final counts
    const [
      { count: totalProducts },
      { count: totalLinks },
      { count: totalPosts },
      { data: systemState }
    ] = await Promise.all([
      supabase.from('product_catalog').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('affiliate_links').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('posted_content').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'posted'),
      supabase.from('system_state').select('*').eq('user_id', user.id).maybeSingle()
    ]);

    return res.status(200).json({
      success: true,
      message: 'System activated and posts published!',
      results: {
        productsDiscovered: result.productsDiscovered,
        postsCreated: result.postsCreated,
        engagement: {
          totalViews: engagement.views,
          totalClicks: engagement.clicks,
          totalConversions: engagement.conversions
        }
      },
      currentState: {
        totalProducts: totalProducts || 0,
        totalLinks: totalLinks || 0,
        totalPosts: totalPosts || 0,
        postsToday: systemState?.posts_today || 0,
        lastPostAt: systemState?.last_post_at || null
      },
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Force activate error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}