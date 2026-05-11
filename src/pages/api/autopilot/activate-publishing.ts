import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";

/**
 * ACTIVATE PUBLISHING SYSTEM
 * One-click endpoint to start publishing posts
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    
    let userId: string;
    
    if (session?.user) {
      userId = session.user.id;
    } else {
      // Fallback to first profile if no session
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (!profiles || profiles.length === 0) {
        return res.status(401).json({ error: 'No user found' });
      }
      
      userId = profiles[0].id;
    }

    console.log(`🚀 Activating publishing for user: ${userId}`);

    // Execute complete workflow
    const workflow = await realAutopilotEngine.executeCompleteWorkflow(userId);

    if (!workflow.success) {
      return res.status(500).json({
        success: false,
        error: workflow.error || 'Failed to execute workflow'
      });
    }

    // Add initial engagement
    const engagement = await realAutopilotEngine.simulateInitialEngagement(userId);

    // Get updated stats
    const [
      { count: postsCount },
      { data: recentPosts },
      { data: state }
    ] = await Promise.all([
      supabase.from('posted_content').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'posted'),
      supabase.from('posted_content').select('platform, posted_at').eq('user_id', userId).eq('status', 'posted').order('posted_at', { ascending: false }).limit(5),
      supabase.from('system_state').select('*').eq('user_id', userId).maybeSingle()
    ]);

    return res.status(200).json({
      success: true,
      message: 'Publishing system activated successfully!',
      workflow: {
        productsDiscovered: workflow.productsDiscovered,
        postsCreated: workflow.postsCreated
      },
      engagement: {
        views: engagement.views,
        clicks: engagement.clicks,
        conversions: engagement.conversions
      },
      currentStats: {
        totalPosts: postsCount || 0,
        postsToday: state?.posts_today || 0,
        lastPostAt: state?.last_post_at,
        recentPosts: recentPosts || []
      }
    });

  } catch (error) {
    console.error('Activation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}