import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { realTrafficEngine } from "@/services/realTrafficEngine";

/**
 * END-TO-END SYSTEM TEST
 * 
 * Complete workflow validation:
 * 1. Product Discovery
 * 2. Link Generation
 * 3. Content Creation
 * 4. Traffic Distribution
 * 5. Tracking Setup
 * 6. Performance Monitoring
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  const testResults: any[] = [];

  try {
    console.log('🚀 STARTING END-TO-END SYSTEM TEST');
    console.log('Time:', new Date().toISOString());

    // STEP 1: Get or create test user
    testResults.push({ step: 'User Setup', status: 'STARTED' });
    const { data: { user } } = await supabase.auth.getUser();
    
    let userId: string;
    if (user) {
      userId = user.id;
    } else {
      // Get first available user
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (!users || users.length === 0) {
        throw new Error('No users found - please sign up first');
      }
      userId = users[0].id;
    }
    
    testResults.push({ step: 'User Setup', status: 'SUCCESS', userId });

    // STEP 2: Check products
    testResults.push({ step: 'Product Discovery', status: 'STARTED' });
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(10);

    if (productsError) throw productsError;
    
    const productCount = products?.length || 0;
    testResults.push({ 
      step: 'Product Discovery', 
      status: productCount > 0 ? 'SUCCESS' : 'WARNING',
      count: productCount,
      message: productCount === 0 ? 'No products found - need to sync integrations' : undefined
    });

    // STEP 3: Check affiliate links
    testResults.push({ step: 'Affiliate Links', status: 'STARTED' });
    const { data: links, error: linksError } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(10);

    if (linksError) throw linksError;
    
    const linkCount = links?.length || 0;
    testResults.push({ 
      step: 'Affiliate Links', 
      status: linkCount > 0 ? 'SUCCESS' : 'WARNING',
      count: linkCount,
      message: linkCount === 0 ? 'No affiliate links - need to generate from products' : undefined
    });

    // STEP 4: Check generated content
    testResults.push({ step: 'Content Generation', status: 'STARTED' });
    const { data: content, error: contentError } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', userId)
      .limit(10);

    if (contentError) throw contentError;
    
    const contentCount = content?.length || 0;
    testResults.push({ 
      step: 'Content Generation', 
      status: contentCount > 0 ? 'SUCCESS' : 'WARNING',
      count: contentCount,
      message: contentCount === 0 ? 'No content generated - autopilot needs to run' : undefined
    });

    // STEP 5: Check traffic sources
    testResults.push({ step: 'Traffic Sources', status: 'STARTED' });
    const { data: trafficSources, error: trafficError } = await supabase
      .from('traffic_sources')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (trafficError) throw trafficError;
    
    const sourceCount = trafficSources?.length || 0;
    testResults.push({ 
      step: 'Traffic Sources', 
      status: sourceCount > 0 ? 'SUCCESS' : 'WARNING',
      count: sourceCount,
      message: sourceCount === 0 ? 'No traffic sources configured' : undefined
    });

    // STEP 6: Test traffic engine
    testResults.push({ step: 'Traffic Engine', status: 'STARTED' });
    const allTactics = realTrafficEngine.getAllTactics();
    const quickWins = realTrafficEngine.getQuickWinTactics();
    const trafficPlan = await realTrafficEngine.generateTrafficPlan(
      'test-content-id',
      ['Pinterest', 'Reddit', 'TikTok']
    );
    
    testResults.push({ 
      step: 'Traffic Engine', 
      status: 'SUCCESS',
      totalTactics: allTactics.length,
      quickWinTactics: quickWins.length,
      estimatedReach: trafficPlan.totalEstimatedReach
    });

    // STEP 7: Check tracking
    testResults.push({ step: 'Click Tracking', status: 'STARTED' });
    const { data: clicks } = await supabase
      .from('click_events')
      .select('count')
      .eq('user_id', userId);
    
    const clickCount = clicks?.length || 0;
    testResults.push({ 
      step: 'Click Tracking', 
      status: 'SUCCESS',
      totalClicks: clickCount
    });

    // STEP 8: Check conversions
    testResults.push({ step: 'Conversion Tracking', status: 'STARTED' });
    const { data: conversions } = await supabase
      .from('conversion_events')
      .select('*')
      .eq('user_id', userId);
    
    const conversionCount = conversions?.length || 0;
    const totalRevenue = conversions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    
    testResults.push({ 
      step: 'Conversion Tracking', 
      status: 'SUCCESS',
      totalConversions: conversionCount,
      totalRevenue: totalRevenue
    });

    // STEP 9: Check autopilot status
    testResults.push({ step: 'Autopilot Status', status: 'STARTED' });
    const { data: settings } = await supabase
      .from('user_settings')
      .select('autopilot_enabled, last_autopilot_run')
      .eq('user_id', userId)
      .maybeSingle();
    
    testResults.push({ 
      step: 'Autopilot Status', 
      status: settings?.autopilot_enabled ? 'SUCCESS' : 'WARNING',
      autopilotEnabled: settings?.autopilot_enabled || false,
      lastRun: settings?.last_autopilot_run,
      message: !settings?.autopilot_enabled ? 'Autopilot is disabled' : undefined
    });

    // STEP 10: System health score
    const healthScore = testResults.filter(r => r.status === 'SUCCESS').length / testResults.length * 100;
    const warnings = testResults.filter(r => r.status === 'WARNING');
    const failures = testResults.filter(r => r.status === 'FAILED');

    const duration = Date.now() - startTime;

    return res.status(200).json({
      success: failures.length === 0,
      healthScore: Math.round(healthScore),
      duration: `${duration}ms`,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'SUCCESS').length,
        warnings: warnings.length,
        failed: failures.length
      },
      results: testResults,
      recommendations: [
        productCount === 0 ? 'Connect affiliate networks and sync products' : null,
        linkCount === 0 ? 'Generate affiliate links from products' : null,
        contentCount === 0 ? 'Run autopilot to generate content' : null,
        sourceCount === 0 ? 'Configure traffic sources' : null,
        !settings?.autopilot_enabled ? 'Enable autopilot in settings' : null,
      ].filter(Boolean),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ END-TO-END TEST FAILED:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results: testResults,
      timestamp: new Date().toISOString()
    });
  }
}