import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

/**
 * COMPLETE END-TO-END SYSTEM TEST
 * Tests: Products → Posts → Click Tracking → System State → Dashboard
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Starting complete system test...');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const testLog: string[] = [];
    testLog.push(`✅ User authenticated: ${user.id}`);

    // TEST 1: Product Sync
    testLog.push('\n📦 TEST 1: Product Sync');
    const { data: affiliateLinks } = await supabase
      .from('affiliate_links')
      .select('id, product_name, network, clicks')
      .eq('user_id', user.id);

    const { data: catalogProducts } = await supabase
      .from('product_catalog')
      .select('id, name, network')
      .eq('user_id', user.id);

    const productsMatch = (affiliateLinks?.length || 0) === (catalogProducts?.length || 0);
    testLog.push(`  Affiliate Links: ${affiliateLinks?.length || 0}`);
    testLog.push(`  Product Catalog: ${catalogProducts?.length || 0}`);
    testLog.push(`  ${productsMatch ? '✅' : '❌'} Product Sync: ${productsMatch ? 'PASS' : 'FAIL'}`);

    // TEST 2: Posted Content
    testLog.push('\n📱 TEST 2: Posted Content');
    const { data: posts } = await supabase
      .from('posted_content')
      .select('id, platform, clicks, conversions, revenue')
      .eq('user_id', user.id)
      .not('posted_at', 'is', null);

    const totalPostClicks = posts?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;
    const totalPostConversions = posts?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0;
    const totalPostRevenue = posts?.reduce((sum, p) => sum + Number(p.revenue || 0), 0) || 0;

    testLog.push(`  Total Posts: ${posts?.length || 0}`);
    testLog.push(`  Total Clicks: ${totalPostClicks}`);
    testLog.push(`  Total Conversions: ${totalPostConversions}`);
    testLog.push(`  Total Revenue: $${totalPostRevenue.toFixed(2)}`);
    testLog.push(`  ${(posts?.length || 0) > 0 ? '✅' : '❌'} Posted Content: ${(posts?.length || 0) > 0 ? 'PASS' : 'FAIL'}`);

    // TEST 3: System State
    testLog.push('\n📊 TEST 3: System State');
    const { data: systemState } = await supabase
      .from('system_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (systemState) {
      testLog.push(`  Views: ${systemState.total_views || 0}`);
      testLog.push(`  Clicks: ${systemState.total_clicks || 0}`);
      testLog.push(`  Conversions: ${systemState.total_verified_conversions || 0}`);
      testLog.push(`  Revenue: $${Number(systemState.total_verified_revenue || 0).toFixed(2)}`);
      testLog.push(`  State: ${systemState.state}`);
      testLog.push(`  ✅ System State: PASS`);
    } else {
      testLog.push(`  ❌ System State: FAIL - Not found`);
    }

    // TEST 4: Click Events
    testLog.push('\n🖱️ TEST 4: Click Events');
    const { data: clickEvents } = await supabase
      .from('click_events')
      .select('id, clicked_at, converted')
      .eq('user_id', user.id)
      .order('clicked_at', { ascending: false })
      .limit(5);

    testLog.push(`  Total Click Events: ${clickEvents?.length || 0}`);
    if (clickEvents && clickEvents.length > 0) {
      testLog.push(`  Latest Click: ${clickEvents[0].clicked_at}`);
      testLog.push(`  ✅ Click Events: PASS`);
    } else {
      testLog.push(`  ⚠️ Click Events: No events yet (normal for new setup)`);
    }

    // TEST 5: Conversion Events
    testLog.push('\n💰 TEST 5: Conversion Events');
    const { data: conversions } = await supabase
      .from('conversion_events')
      .select('id, revenue, verified, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    testLog.push(`  Total Conversions: ${conversions?.length || 0}`);
    if (conversions && conversions.length > 0) {
      const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.revenue), 0);
      testLog.push(`  Total Revenue: $${totalRevenue.toFixed(2)}`);
      testLog.push(`  ✅ Conversion Events: PASS`);
    } else {
      testLog.push(`  ⚠️ Conversion Events: No events yet (normal for new setup)`);
    }

    // OVERALL RESULT
    testLog.push('\n🎯 OVERALL RESULT:');
    const criticalTests = [productsMatch, (posts?.length || 0) > 0, !!systemState];
    const passed = criticalTests.filter(t => t).length;
    const total = criticalTests.length;
    
    testLog.push(`  ${passed}/${total} critical tests passed`);
    testLog.push(`  ${passed === total ? '🎉 SYSTEM OPERATIONAL' : '⚠️ SOME ISSUES FOUND'}`);

    console.log(testLog.join('\n'));

    return res.status(200).json({
      success: passed === total,
      test_log: testLog,
      summary: {
        products: {
          affiliate_links: affiliateLinks?.length || 0,
          product_catalog: catalogProducts?.length || 0,
          synced: productsMatch
        },
        posted_content: {
          total_posts: posts?.length || 0,
          total_clicks: totalPostClicks,
          total_conversions: totalPostConversions,
          total_revenue: totalPostRevenue
        },
        system_state: systemState ? {
          views: systemState.total_views,
          clicks: systemState.total_clicks,
          conversions: systemState.total_verified_conversions,
          revenue: Number(systemState.total_verified_revenue),
          state: systemState.state
        } : null,
        tracking: {
          click_events: clickEvents?.length || 0,
          conversion_events: conversions?.length || 0
        },
        overall: {
          passed,
          total,
          status: passed === total ? 'OPERATIONAL' : 'ISSUES_FOUND'
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}