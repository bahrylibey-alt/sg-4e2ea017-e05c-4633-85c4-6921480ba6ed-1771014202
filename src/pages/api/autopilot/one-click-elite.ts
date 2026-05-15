import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { eliteAutopilotEngine } from "@/services/eliteAutopilotEngine";

/**
 * ONE-CLICK ELITE AUTOPILOT ACTIVATION
 * Restores and runs the complete April 2026 working system
 * 
 * Executes all 8 phases:
 * 1. Intelligent Product Discovery
 * 2. Pre-Sell Bridge Pages
 * 3. Story-Based Content Generation
 * 4. Email Capture Funnels
 * 5. Retargeting Pixel Installation
 * 6. Viral Loop Activation
 * 7. Multi-Channel Distribution
 * 8. Auto-Optimization Engine
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 ONE-CLICK ELITE AUTOPILOT ACTIVATION');

  try {
    // Get user - either from existing profile or create one
    const { data: profiles, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('id, email')
      .limit(1);

    let userId: string;

    if (!profiles || profiles.length === 0) {
      // No user exists - create one
      console.log('No user found, creating system user...');
      
      const { data: newProfile, error: createError } = await (supabase as any)
        .from('profiles')
        .insert({
          email: 'system@salemakseb.com',
          full_name: 'System User'
        })
        .select()
        .single();

      if (createError || !newProfile) {
        console.error('Failed to create system user:', createError);
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize system user'
        });
      }

      userId = newProfile.id;
      console.log(`✅ Created system user: ${userId}`);
    } else {
      userId = profiles[0].id;
      console.log(`✅ Using existing user: ${userId}`);
    }

    // Start execution
    console.log('🎯 Starting Elite Workflow Execution...');
    
    const result = await eliteAutopilotEngine.executeEliteWorkflow({
      userId,
      productLimit: 10,
      platforms: ['pinterest', 'tiktok', 'instagram', 'twitter', 'facebook'],
      enableEmailCapture: true,
      enableRetargeting: true,
      enableViralLoops: true,
      autoOptimize: true
    });

    // Enable autopilot in settings
    await (supabase as any)
      .from('user_settings')
      .upsert({
        user_id: userId,
        autopilot_enabled: true,
        last_autopilot_run: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log('✅ ELITE AUTOPILOT ACTIVATION COMPLETE');

    return res.status(200).json({
      success: true,
      message: 'Elite Autopilot System Activated Successfully!',
      result: {
        products: result.products,
        bridgePages: result.bridgePages,
        content: result.content,
        posted: result.posted,
        features: {
          emailFunnels: result.funnelsActive,
          retargeting: result.retargetingActive,
          viralLoops: result.viralActive,
          autoOptimization: result.optimizationActive
        }
      },
      phases: [
        '✅ Phase 1: Product Discovery Complete',
        '✅ Phase 2: Bridge Pages Created',
        '✅ Phase 3: Story Content Generated',
        '✅ Phase 4: Email Funnels Active',
        '✅ Phase 5: Retargeting Pixels Installed',
        '✅ Phase 6: Viral Loops Activated',
        '✅ Phase 7: Multi-Channel Distribution Complete',
        '✅ Phase 8: Auto-Optimization Running'
      ],
      nextSteps: [
        'Monitor performance in Dashboard',
        'View bridge pages at /presell/[slug]',
        'Check email sequences in Settings',
        'Track conversions in Analytics'
      ]
    });

  } catch (error) {
    console.error('❌ Elite activation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      troubleshooting: [
        'Check database connection',
        'Ensure all tables exist',
        'Review console logs for details',
        'Verify Supabase configuration'
      ]
    });
  }
}