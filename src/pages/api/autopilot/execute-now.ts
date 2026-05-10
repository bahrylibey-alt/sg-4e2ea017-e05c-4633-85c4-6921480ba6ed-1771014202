import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * IMMEDIATE AUTOPILOT EXECUTION
 * 
 * Runs the full autopilot cycle RIGHT NOW (no cron waiting)
 * Use this for manual testing and immediate results
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Return current stats
  if (req.method === 'GET') {
    try {
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id')
        .limit(1);

      if (!profiles || profiles.length === 0) {
        return res.status(200).json({
          currentStats: {
            totalProducts: 0,
            totalLinks: 0,
            totalContent: 0,
            totalPosts: 0
          }
        });
      }

      const userId = profiles[0].id;

      const { data: products } = await (supabase as any)
        .from('product_catalog')
        .select('count')
        .eq('user_id', userId);

      const { data: links } = await (supabase as any)
        .from('affiliate_links')
        .select('count')
        .eq('user_id', userId);

      const { data: content } = await (supabase as any)
        .from('generated_content')
        .select('count')
        .eq('user_id', userId);

      const { data: posts } = await (supabase as any)
        .from('posted_content')
        .select('count')
        .eq('user_id', userId);

      return res.status(200).json({
        currentStats: {
          totalProducts: products?.[0]?.count || 0,
          totalLinks: links?.[0]?.count || 0,
          totalContent: content?.[0]?.count || 0,
          totalPosts: posts?.[0]?.count || 0
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 MANUAL AUTOPILOT EXECUTION TRIGGERED');

  try {
    // Get user
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users found. Please sign up first.'
      });
    }

    const userId = profiles[0].id;

    // Execute full cycle
    console.log(`Executing autopilot for user ${userId}...`);
    
    const result = await selfHealingAutopilot.executeFullCycle({
      userId,
      maxProducts: 15,
      maxContentPerProduct: 5,
      platforms: ['pinterest', 'reddit', 'medium', 'twitter', 'facebook']
    });

    // Get fresh stats
    const { data: products } = await (supabase as any)
      .from('product_catalog')
      .select('count')
      .eq('user_id', userId);

    const { data: links } = await (supabase as any)
      .from('affiliate_links')
      .select('count')
      .eq('user_id', userId);

    const { data: content } = await (supabase as any)
      .from('generated_content')
      .select('count')
      .eq('user_id', userId);

    const { data: posts } = await (supabase as any)
      .from('posted_content')
      .select('count')
      .eq('user_id', userId);

    return res.status(200).json({
      success: result.success,
      message: result.success ? '✅ Autopilot executed successfully' : '⚠️ Autopilot completed with errors',
      execution: result.execution,
      summary: result.summary,
      currentStats: {
        totalProducts: products?.[0]?.count || 0,
        totalLinks: links?.[0]?.count || 0,
        totalContent: content?.[0]?.count || 0,
        totalPosts: posts?.[0]?.count || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual autopilot error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}