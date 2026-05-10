import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * IMMEDIATE AUTOPILOT EXECUTION
 * 
 * POST: Starts background execution, returns job ID immediately
 * GET: Returns current status and stats
 */

// In-memory job tracking (simple approach - replace with Redis/DB for production)
const jobs: Map<string, any> = new Map();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Return current stats and job status
  if (req.method === 'GET') {
    try {
      const jobId = req.query.jobId as string;

      // If checking specific job
      if (jobId && jobs.has(jobId)) {
        return res.status(200).json({
          job: jobs.get(jobId)
        });
      }

      // Otherwise return stats
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

      const [
        { count: productsCount },
        { count: linksCount },
        { count: contentCount },
        { count: postsCount }
      ] = await Promise.all([
        (supabase as any).from('product_catalog').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        (supabase as any).from('affiliate_links').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        (supabase as any).from('generated_content').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        (supabase as any).from('posted_content').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      ]);

      return res.status(200).json({
        currentStats: {
          totalProducts: productsCount || 0,
          totalLinks: linksCount || 0,
          totalContent: contentCount || 0,
          totalPosts: postsCount || 0
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

  console.log('🚀 AUTOPILOT EXECUTION TRIGGERED');

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
    const jobId = `job-${Date.now()}`;

    // Initialize job
    jobs.set(jobId, {
      id: jobId,
      status: 'running',
      progress: 0,
      phase: 'Starting...',
      startTime: new Date().toISOString(),
      results: null
    });

    // Return immediately with job ID
    res.status(200).json({
      success: true,
      message: 'Autopilot execution started',
      jobId,
      pollUrl: `/api/autopilot/execute-now?jobId=${jobId}`
    });

    // Execute in background (non-blocking)
    executeInBackground(userId, jobId).catch(error => {
      console.error('Background execution error:', error);
      jobs.set(jobId, {
        ...jobs.get(jobId),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error('❌ Autopilot trigger error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Background execution function
 */
async function executeInBackground(userId: string, jobId: string) {
  try {
    // Update progress
    const updateJob = (phase: string, progress: number, data?: any) => {
      jobs.set(jobId, {
        ...jobs.get(jobId),
        phase,
        progress,
        ...data
      });
    };

    updateJob('🔍 Discovering trending products...', 10);

    // Execute full cycle
    const result = await selfHealingAutopilot.executeFullCycle({
      userId,
      maxProducts: 10,
      maxContentPerProduct: 3,
      platforms: ['pinterest', 'reddit', 'medium']
    });

    updateJob('✅ Complete', 100);

    // Get final stats
    const [
      { count: productsCount },
      { count: linksCount },
      { count: contentCount },
      { count: postsCount }
    ] = await Promise.all([
      (supabase as any).from('product_catalog').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      (supabase as any).from('affiliate_links').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      (supabase as any).from('generated_content').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      (supabase as any).from('posted_content').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    // Mark as complete
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'completed',
      progress: 100,
      phase: '✅ Execution complete',
      results: result,
      currentStats: {
        totalProducts: productsCount || 0,
        totalLinks: linksCount || 0,
        totalContent: contentCount || 0,
        totalPosts: postsCount || 0
      },
      endTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Background execution error:', error);
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      endTime: new Date().toISOString()
    });
  }
}