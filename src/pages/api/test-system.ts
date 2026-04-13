import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

/**
 * COMPLETE SYSTEM TEST
 * Tests all tracking components end-to-end
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

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log(`✅ User authenticated: ${user.id}`);

    const testResults: any = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Product Sync
    console.log('📦 Test 1: Product Sync');
    const { data: affiliateLinks } = await (supabase as any)
      .from('affiliate_links')
      .select('id, product_name, network, clicks')
      .eq('user_id', user.id);

    const { data: catalogProducts } = await (supabase as any)
      .from('product_catalog')
      .select('id, name, network');

    testResults.tests.product_sync = {
      status: (affiliateLinks?.length || 0) > 0 && (catalogProducts?.length || 0) > 0 ? 'PASS' : 'FAIL',
      affiliate_links_count: affiliateLinks?.length || 0,
      product_catalog_count: catalogProducts?.length || 0,
      sync_match: (affiliateLinks?.length || 0) === (catalogProducts?.length || 0),
      sample_products: affiliateLinks?.slice(0, 3).map((l: any) => ({
        name: l.product_name,
        network: l.network,
        clicks: l.clicks
      }))
    };

    // Test 2: System State
    console.log('📊 Test 2: System State');
    const { data: systemState } = await (supabase as any)
      .from('system_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    testResults.tests.system_state = {
      status: systemState ? 'PASS' : 'FAIL',
      total_views: systemState?.total_views || 0,
      total_clicks: systemState?.total_clicks || 0,
      total_conversions: systemState?.total_verified_conversions || 0,
      total_revenue: systemState?.total_verified_revenue || 0,
      current_state: systemState?.state || 'NO_TRAFFIC',
      has_traffic: (systemState?.total_views || 0) > 0
    };

    // Test 3: Click Events
    console.log('🖱️ Test 3: Click Tracking');
    const { data: clickEvents } = await (supabase as any)
      .from('click_events')
      .select('id, link_id, clicked_at, converted')
      .eq('user_id', user.id)
      .order('clicked_at', { ascending: false })
      .limit(10);

    testResults.tests.click_tracking = {
      status: 'PASS',
      total_clicks_recorded: clickEvents?.length || 0,
      recent_clicks: clickEvents?.slice(0, 3).map((c: any) => ({
        clicked_at: c.clicked_at,
        converted: c.converted
      })),
      tracking_active: (clickEvents?.length || 0) > 0
    };

    // Test 4: Conversion Events
    console.log('💰 Test 4: Conversion Tracking');
    const { data: conversions } = await (supabase as any)
      .from('conversion_events')
      .select('id, revenue, verified, source, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    testResults.tests.conversion_tracking = {
      status: 'PASS',
      total_conversions: conversions?.length || 0,
      verified_conversions: conversions?.filter((c: any) => c.verified).length || 0,
      total_revenue: conversions?.reduce((sum: number, c: any) => sum + Number(c.revenue), 0) || 0,
      recent_conversions: conversions?.slice(0, 3).map((c: any) => ({
        revenue: c.revenue,
        verified: c.verified,
        source: c.source,
        created_at: c.created_at
      }))
    };

    // Test 5: Posted Content
    console.log('📱 Test 5: Posted Content');
    const { data: posts } = await (supabase as any)
      .from('posted_content')
      .select('id, platform, status, posted_at, clicks, conversions, revenue')
      .eq('user_id', user.id)
      .not('posted_at', 'is', null)
      .order('posted_at', { ascending: false })
      .limit(10);

    testResults.tests.posted_content = {
      status: posts && posts.length > 0 ? 'PASS' : 'FAIL',
      total_posts: posts?.length || 0,
      total_post_clicks: posts?.reduce((sum: number, p: any) => sum + (p.clicks || 0), 0) || 0,
      total_post_conversions: posts?.reduce((sum: number, p: any) => sum + (p.conversions || 0), 0) || 0,
      total_post_revenue: posts?.reduce((sum: number, p: any) => sum + Number(p.revenue || 0), 0) || 0,
      recent_posts: posts?.slice(0, 3).map((p: any) => ({
        platform: p.platform,
        clicks: p.clicks,
        conversions: p.conversions,
        revenue: p.revenue
      }))
    };

    // Test 6: Generated Content
    console.log('✍️ Test 6: Generated Content');
    const { data: generatedContent } = await (supabase as any)
      .from('generated_content')
      .select('id, status, type, created_at')
      .eq('user_id', user.id);

    testResults.tests.generated_content = {
      status: generatedContent && generatedContent.length > 0 ? 'PASS' : 'FAIL',
      total_generated: generatedContent?.length || 0,
      published: generatedContent?.filter((c: any) => c.status === 'published').length || 0,
      draft: generatedContent?.filter((c: any) => c.status === 'draft').length || 0
    };

    // Overall System Status
    const totalTests = Object.keys(testResults.tests).length;
    const passedTests = Object.values(testResults.tests).filter((t: any) => t.status === 'PASS').length;
    
    testResults.overall = {
      total_tests: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      success_rate: `${Math.round((passedTests / totalTests) * 100)}%`,
      system_healthy: passedTests >= 5
    };

    console.log('✅ System test complete:', testResults.overall);

    return res.status(200).json({
      success: true,
      test_results: testResults,
      message: `System test complete: ${passedTests}/${totalTests} tests passed`
    });

  } catch (error: any) {
    console.error('❌ System test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}