import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { trendingProductDiscovery } from "@/services/trendingProductDiscovery";
import { aiContentGenerator } from "@/services/aiContentGenerator";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testResults: any[] = [];
  const startTime = Date.now();

  try {
    // Get user
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    if (!profiles || profiles.length === 0) {
      throw new Error('No user found - please create an account first');
    }
    const userId = profiles[0].id;

    testResults.push({
      step: '1. User Verification',
      status: '✅ PASS',
      userId,
      timestamp: new Date().toISOString()
    });

    // STEP 1: Discover Real Products
    testResults.push({
      step: '2. Product Discovery',
      status: '🔄 RUNNING',
      message: 'Discovering trending products from real sources...'
    });

    const discoveryResult = await trendingProductDiscovery.discoverAllTrendingProducts(userId);
    
    testResults.push({
      step: '2. Product Discovery',
      status: '✅ PASS',
      productsFound: discoveryResult.total_found,
      productsSaved: discoveryResult.top_products.length,
      sources: discoveryResult.sources_checked
    });

    // Verify products saved
    const { data: savedProducts } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (!savedProducts || savedProducts.length === 0) {
      throw new Error('Product discovery succeeded but no products saved to database');
    }

    testResults.push({
      step: '3. Product Validation',
      status: '✅ PASS',
      verifiedProducts: savedProducts.length,
      sampleProduct: savedProducts[0].name
    });

    // STEP 2: Create Affiliate Links
    testResults.push({
      step: '4. Affiliate Link Generation',
      status: '🔄 RUNNING'
    });

    const linksCreated: string[] = [];
    for (const product of savedProducts) {
      const { data: link, error } = await supabase
        .from('affiliate_links')
        .insert({
          user_id: userId,
          product_id: product.id,
          original_url: product.affiliate_url,
          short_code: `${product.id.substring(0, 8)}`,
          status: 'active'
        })
        .select()
        .single();

      if (!error && link) {
        linksCreated.push(link.id);
      }
    }

    testResults.push({
      step: '4. Affiliate Link Generation',
      status: linksCreated.length > 0 ? '✅ PASS' : '⚠️ WARNING',
      linksCreated: linksCreated.length
    });

    // STEP 3: Generate Content
    testResults.push({
      step: '5. AI Content Generation',
      status: '🔄 RUNNING'
    });

    const contentProduct = savedProducts[0];
    const posts = await aiContentGenerator.generateAllPlatforms(contentProduct, userId);

    testResults.push({
      step: '5. AI Content Generation',
      status: posts.length === 6 ? '✅ PASS' : '⚠️ WARNING',
      postsGenerated: posts.length,
      platforms: posts.map(p => p.platform)
    });

    // STEP 4: Verify Traffic Sources
    testResults.push({
      step: '6. Traffic Source Check',
      status: '🔄 RUNNING'
    });

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId);

    const campaignIds = campaigns?.map(c => c.id) || [];
    let activeTraffic = 0;

    if (campaignIds.length > 0) {
      const { data: trafficSources } = await supabase
        .from('traffic_sources')
        .select('*')
        .in('campaign_id', campaignIds)
        .eq('status', 'active');

      activeTraffic = trafficSources?.length || 0;
    }

    testResults.push({
      step: '6. Traffic Source Check',
      status: activeTraffic > 0 ? '✅ PASS' : '⚠️ WARNING',
      activeSources: activeTraffic,
      campaigns: campaignIds.length
    });

    // STEP 5: Enable Autopilot
    testResults.push({
      step: '7. Autopilot Activation',
      status: '🔄 RUNNING'
    });

    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        autopilot_enabled: true,
        last_autopilot_run: new Date().toISOString()
      });

    testResults.push({
      step: '7. Autopilot Activation',
      status: '✅ PASS',
      enabled: true
    });

    // STEP 6: System Health Check
    const { data: healthProducts } = await supabase
      .from('product_catalog')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    const { data: healthLinks } = await supabase
      .from('affiliate_links')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { data: healthContent } = await supabase
      .from('generated_content')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    const systemHealth = {
      products: healthProducts?.length || 0,
      links: healthLinks?.length || 0,
      content: healthContent?.length || 0,
      traffic: activeTraffic
    };

    testResults.push({
      step: '8. System Health',
      status: '✅ COMPLETE',
      health: systemHealth
    });

    // Calculate test duration
    const duration = (Date.now() - startTime) / 1000;

    return res.status(200).json({
      success: true,
      message: 'End-to-end test completed successfully',
      duration: `${duration.toFixed(2)}s`,
      results: testResults,
      summary: {
        totalSteps: testResults.length,
        passed: testResults.filter(r => r.status?.includes('✅')).length,
        warnings: testResults.filter(r => r.status?.includes('⚠️')).length,
        systemHealth
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('End-to-end test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results: testResults,
      timestamp: new Date().toISOString()
    });
  }
}