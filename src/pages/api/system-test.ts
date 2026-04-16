import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPLETE SYSTEM TEST
 * 
 * Tests every component with REAL data validation
 * Reports exactly what's missing/broken
 */

interface SystemTest {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const tests: SystemTest[] = [];
  
  try {
    // Get user from query param
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required in query params' });
    }

    console.log('🧪 SYSTEM TEST: Starting comprehensive test...');

    // TEST 1: User Settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    tests.push({
      name: 'User Settings',
      status: userSettings ? 'PASS' : 'FAIL',
      message: userSettings 
        ? 'User settings exist' 
        : settingsError?.message || 'No user settings found',
      data: userSettings
    });

    // TEST 2: Autopilot Settings
    const { data: autopilotSettings, error: autopilotError } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    tests.push({
      name: 'Autopilot Settings',
      status: autopilotSettings ? 'PASS' : 'FAIL',
      message: autopilotSettings 
        ? 'Autopilot configured' 
        : autopilotError?.message || 'No autopilot settings',
      data: autopilotSettings
    });

    // TEST 3: Connected Integrations
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('provider, status, category')
      .eq('user_id', userId)
      .eq('status', 'connected');

    const affiliateNetworks = integrations?.filter(i => i.category === 'affiliate') || [];
    const trafficSources = integrations?.filter(i => i.category === 'traffic') || [];

    tests.push({
      name: 'Affiliate Networks',
      status: affiliateNetworks.length > 0 ? 'PASS' : 'FAIL',
      message: affiliateNetworks.length > 0 
        ? `${affiliateNetworks.length} networks connected: ${affiliateNetworks.map(i => i.provider).join(', ')}`
        : 'No affiliate networks connected - go to /integrations',
      data: { networks: affiliateNetworks.map(i => i.provider) }
    });

    tests.push({
      name: 'Traffic Sources',
      status: trafficSources.length > 0 ? 'PASS' : 'FAIL',
      message: trafficSources.length > 0 
        ? `${trafficSources.length} sources connected: ${trafficSources.map(i => i.provider).join(', ')}`
        : 'No traffic sources connected - go to /integrations',
      data: { sources: trafficSources.map(i => i.provider) }
    });

    // TEST 4: Product Catalog
    const { data: products, count: productCount } = await supabase
      .from('affiliate_links')
      .select('id, product_name, network, status', { count: 'exact' })
      .eq('user_id', userId);

    tests.push({
      name: 'Product Catalog',
      status: (productCount || 0) > 0 ? 'PASS' : 'FAIL',
      message: (productCount || 0) > 0 
        ? `${productCount} products found`
        : 'No products - run product discovery',
      data: { 
        count: productCount,
        sample: products?.slice(0, 3).map(p => p.product_name)
      }
    });

    // TEST 5: Tracking Data
    const { data: clicks, count: clickCount } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: views, count: viewCount } = await supabase
      .from('view_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: conversions, count: conversionCount } = await supabase
      .from('conversion_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    tests.push({
      name: 'Tracking Data',
      status: ((clickCount || 0) > 0 || (viewCount || 0) > 0) ? 'PASS' : 'FAIL',
      message: `${clickCount || 0} clicks, ${viewCount || 0} views, ${conversionCount || 0} conversions`,
      data: {
        clicks: clickCount,
        views: viewCount,
        conversions: conversionCount
      }
    });

    // TEST 6: Posted Content
    const { data: posts, count: postCount } = await supabase
      .from('posted_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    tests.push({
      name: 'Posted Content',
      status: (postCount || 0) > 0 ? 'PASS' : 'SKIP',
      message: (postCount || 0) > 0 
        ? `${postCount} posts found`
        : 'No posts yet - will be created by autopilot',
      data: { count: postCount }
    });

    // TEST 7: System State
    const { data: systemState } = await supabase
      .from('system_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    tests.push({
      name: 'System State',
      status: systemState ? 'PASS' : 'SKIP',
      message: systemState 
        ? `State: ${systemState.state}, Views: ${systemState.total_views}, Clicks: ${systemState.total_clicks}`
        : 'No system state yet',
      data: systemState
    });

    // SUMMARY
    const passed = tests.filter(t => t.status === 'PASS').length;
    const failed = tests.filter(t => t.status === 'FAIL').length;
    const skipped = tests.filter(t => t.status === 'SKIP').length;

    const overallStatus = failed === 0 ? 'READY' : 'NOT_READY';

    // ACTION PLAN
    const actions: string[] = [];
    
    if (!userSettings) {
      actions.push('1. Go to /settings and save your preferences');
    }
    if (!autopilotSettings) {
      actions.push('2. Configure autopilot settings in /settings');
    }
    if (affiliateNetworks.length === 0) {
      actions.push('3. Connect at least one affiliate network in /integrations');
    }
    if (trafficSources.length === 0) {
      actions.push('4. Connect at least one traffic source in /integrations');
    }
    if ((productCount || 0) === 0) {
      actions.push('5. Run product discovery: /api/cron/discover-products');
    }

    console.log('✅ SYSTEM TEST: Complete');

    return res.status(200).json({
      status: overallStatus,
      summary: {
        total: tests.length,
        passed,
        failed,
        skipped
      },
      tests,
      actions: actions.length > 0 ? actions : ['System is ready! You can run autopilot.'],
      recommendations: [
        'For autopilot to work, you need:',
        '• At least 1 affiliate network connected',
        '• At least 1 traffic source connected',
        '• At least 1 product in catalog',
        '• User settings configured',
        '',
        'Real data sources:',
        '• Products: From affiliate network APIs',
        '• Clicks: From traffic platform webhooks',
        '• Views: From platform APIs',
        '• Conversions: From postback URLs'
      ]
    });

  } catch (error: any) {
    console.error('❌ SYSTEM TEST ERROR:', error);
    return res.status(500).json({
      error: error.message,
      tests
    });
  }
}