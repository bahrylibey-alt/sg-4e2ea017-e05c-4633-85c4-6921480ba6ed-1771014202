import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * FORCE ACTIVATE SYSTEM
 * 
 * Immediately executes autopilot and generates content/posts
 * Use this to kickstart a dormant system
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 FORCE ACTIVATE SYSTEM');

  try {
    // Get all users
    const { data: users } = await (supabase as any)
      .from('profiles')
      .select('id, email')
      .limit(10);

    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users found'
      });
    }

    const results = [];

    for (const user of users) {
      try {
        console.log(`Activating system for ${user.email}...`);

        // Execute full autopilot cycle
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

        console.log(`✅ Activated for ${user.email}:`, result.summary);

      } catch (error) {
        console.error(`Error activating for ${user.email}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Get updated counts
    const userId = users[0].id;
    const [
      { count: totalProducts },
      { count: totalContent },
      { count: totalPosts }
    ] = await Promise.all([
      (supabase as any).from('product_catalog').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      (supabase as any).from('generated_content').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      (supabase as any).from('posted_content').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    return res.status(200).json({
      success: true,
      message: `System activated for ${users.length} users`,
      results,
      currentTotals: {
        products: totalProducts || 0,
        content: totalContent || 0,
        posts: totalPosts || 0
      },
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Force activate error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}