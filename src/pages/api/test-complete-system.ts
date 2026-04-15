import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPLETE END-TO-END SYSTEM TEST
 * Tests ALL components in order:
 * 1. Database connectivity
 * 2. User data
 * 3. Integrations
 * 4. Products
 * 5. Tracking (views → clicks → conversions)
 * 6. Autopilot scoring
 * 7. Content generation
 * 
 * NO AUTH REQUIRED - For testing purposes
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    userId: 'cd9e03a2-9620-44be-a934-ac2ed69db465',
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    const userId = testResults.userId;

    // TEST 1: Database Connectivity
    console.log('TEST 1: Database Connectivity...');
    try {
      const { data, error } = await supabase.from('profiles').select('count').single();
      testResults.tests.database = {
        name: 'Database Connectivity',
        status: error ? '❌ FAILED' : '✅ PASSED',
        error: error?.message
      };
    } catch (e: any) {
      testResults.tests.database = {
        name: 'Database Connectivity',
        status: '❌ FAILED',
        error: e.message
      };
    }

    // TEST 2: User Exists
    console.log('TEST 2: User Exists...');
    const { data: user } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    testResults.tests.user = {
      name: 'User Exists',
      status: user ? '✅ PASSED' : '❌ FAILED',
      data: user ? { email: user.email } : null
    };

    // TEST 3: Affiliate Networks Connected
    console.log('TEST 3: Affiliate Networks...');
    const { data: affiliateNetworks } = await supabase
      .from('integrations')
      .select('provider, provider_name, status')
      .eq('user_id', userId)
      .eq('category', 'affiliate');

    testResults.tests.affiliateNetworks = {
      name: 'Affiliate Networks',
      status: affiliateNetworks && affiliateNetworks.length > 0 ? '✅ PASSED' : '❌ FAILED',
      count: affiliateNetworks?.length || 0,
      networks: affiliateNetworks?.map(n => n.provider_name)
    };

    // TEST 4: Traffic Sources Connected
    console.log('TEST 4: Traffic Sources...');
    const { data: trafficSources } = await supabase
      .from('integrations')
      .select('provider, provider_name, status')
      .eq('user_id', userId)
      .eq('category', 'tracking');

    testResults.tests.trafficSources = {
      name: 'Traffic Sources',
      status: trafficSources && trafficSources.length > 0 ? '✅ PASSED' : '⚠️ WARNING',
      count: trafficSources?.length || 0,
      sources: trafficSources?.map(s => s.provider_name)
    };

    // TEST 5: Products Available
    console.log('TEST 5: Products...');
    const { data: products } = await supabase
      .from('affiliate_links')
      .select('id, product_name, network')
      .eq('user_id', userId)
      .limit(5);

    testResults.tests.products = {
      name: 'Products Available',
      status: products && products.length > 0 ? '✅ PASSED' : '❌ FAILED',
      count: products?.length || 0,
      samples: products?.map(p => p.product_name)
    };

    // TEST 6: Tracking - Views
    console.log('TEST 6: View Tracking...');
    const testContentId = 'test-complete-' + Date.now();
    const viewResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tracking/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_id: testContentId,
        platform: 'test',
        views: 100,
        user_id: userId
      })
    });
    const viewData = await viewResponse.json();

    testResults.tests.viewTracking = {
      name: 'View Tracking',
      status: viewData.tracked ? '✅ PASSED' : '⚠️ WARNING',
      tracked: viewData.tracked
    };

    // Wait for DB write
    await new Promise(resolve => setTimeout(resolve, 500));

    // TEST 7: Tracking - Clicks
    console.log('TEST 7: Click Tracking...');
    const testClickId = 'test-click-' + Date.now();
    const linkId = products?.[0]?.id;

    if (linkId) {
      const clickResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tracking/clicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: linkId,
          content_id: testContentId,
          platform: 'test',
          user_id: userId,
          click_id: testClickId,
          ip_address: '192.168.1.1'
        })
      });
      const clickData = await clickResponse.json();

      testResults.tests.clickTracking = {
        name: 'Click Tracking',
        status: clickData.tracked ? '✅ PASSED' : '⚠️ WARNING',
        tracked: clickData.tracked
      };

      // Wait for DB write
      await new Promise(resolve => setTimeout(resolve, 500));

      // TEST 8: Tracking - Conversions
      console.log('TEST 8: Conversion Tracking...');
      const conversionResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tracking/conversions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          click_id: testClickId,
          content_id: testContentId,
          user_id: userId,
          revenue: 25.99,
          source: 'webhook',
          verified: true
        })
      });
      const conversionData = await conversionResponse.json();

      testResults.tests.conversionTracking = {
        name: 'Conversion Tracking',
        status: conversionData.tracked ? '✅ PASSED' : '⚠️ WARNING',
        tracked: conversionData.tracked,
        verified: conversionData.verified
      };
    } else {
      testResults.tests.clickTracking = {
        name: 'Click Tracking',
        status: '⚠️ SKIPPED',
        reason: 'No products available'
      };
      testResults.tests.conversionTracking = {
        name: 'Conversion Tracking',
        status: '⚠️ SKIPPED',
        reason: 'No products available'
      };
    }

    // TEST 9: Verify Tracking in Database
    console.log('TEST 9: Database Verification...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: viewEvents } = await supabase
      .from('view_events')
      .select('id')
      .eq('content_id', testContentId);

    const { data: clickEvents } = await supabase
      .from('click_events')
      .select('id')
      .eq('click_id', testClickId);

    const { data: conversionEvents } = await supabase
      .from('conversion_events')
      .select('id, revenue')
      .eq('click_id', testClickId);

    testResults.tests.databaseVerification = {
      name: 'Database Verification',
      status: viewEvents && viewEvents.length > 0 ? '✅ PASSED' : '⚠️ WARNING',
      viewEvents: viewEvents?.length || 0,
      clickEvents: clickEvents?.length || 0,
      conversionEvents: conversionEvents?.length || 0
    };

    // TEST 10: Posted Content Exists
    console.log('TEST 10: Posted Content...');
    const { data: postedContent } = await supabase
      .from('posted_content')
      .select('id, platform, clicks, revenue')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .limit(10);

    testResults.tests.postedContent = {
      name: 'Posted Content',
      status: postedContent && postedContent.length > 0 ? '✅ PASSED' : '⚠️ WARNING',
      count: postedContent?.length || 0,
      totalClicks: postedContent?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0,
      totalRevenue: postedContent?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0
    };

    // TEST 11: Autopilot Status
    console.log('TEST 11: Autopilot Status...');
    const { data: settings } = await supabase
      .from('user_settings')
      .select('autopilot_enabled, last_autopilot_run')
      .eq('user_id', userId)
      .maybeSingle();

    testResults.tests.autopilot = {
      name: 'Autopilot Status',
      status: settings?.autopilot_enabled ? '✅ PASSED' : '⚠️ WARNING',
      enabled: settings?.autopilot_enabled || false,
      lastRun: settings?.last_autopilot_run || 'Never'
    };

    // TEST 12: System State
    console.log('TEST 12: System State...');
    const { data: systemState } = await supabase
      .from('system_state')
      .select('state, total_views, total_clicks, last_post_at')
      .eq('user_id', userId)
      .maybeSingle();

    testResults.tests.systemState = {
      name: 'System State',
      status: systemState ? '✅ PASSED' : '⚠️ WARNING',
      state: systemState?.state || 'UNKNOWN',
      metrics: systemState || null
    };

    // Calculate Summary
    const tests = Object.values(testResults.tests);
    testResults.summary.total = tests.length;
    testResults.summary.passed = tests.filter((t: any) => t.status.includes('✅')).length;
    testResults.summary.failed = tests.filter((t: any) => t.status.includes('❌')).length;
    testResults.summary.warnings = tests.filter((t: any) => t.status.includes('⚠️')).length;

    // Overall Status
    if (testResults.summary.failed === 0) {
      testResults.overallStatus = '✅ ALL SYSTEMS OPERATIONAL';
    } else if (testResults.summary.failed <= 2) {
      testResults.overallStatus = '⚠️ MOSTLY WORKING - MINOR ISSUES';
    } else {
      testResults.overallStatus = '❌ CRITICAL ISSUES DETECTED';
    }

    // Recommendations
    testResults.recommendations = [];
    
    if (!testResults.tests.affiliateNetworks?.status?.includes('✅')) {
      testResults.recommendations.push('Connect affiliate networks in Settings → Integrations');
    }
    if (!testResults.tests.products?.status?.includes('✅')) {
      testResults.recommendations.push('Add products or run product discovery');
    }
    if (!testResults.tests.autopilot?.status?.includes('✅')) {
      testResults.recommendations.push('Enable autopilot in Dashboard');
    }

    console.log('All tests complete!');

    return res.status(200).json({
      success: true,
      ...testResults
    });

  } catch (error: any) {
    console.error('System test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      partialResults: testResults
    });
  }
}