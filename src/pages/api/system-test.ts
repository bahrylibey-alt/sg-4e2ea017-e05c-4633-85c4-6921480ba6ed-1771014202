import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { trendingProductDiscovery } from "@/services/trendingProductDiscovery";
import { realTrafficEngine } from "@/services/realTrafficEngine";

/**
 * COMPLETE SYSTEM TEST - REAL DATA ONLY
 * 
 * This test:
 * 1. Purges ALL mock/fake data
 * 2. Discovers REAL 2026 trending products
 * 3. Generates REAL content with OpenAI
 * 4. Attempts REAL posting (requires API setup)
 * 5. Reports what's working and what needs setup
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const testResults: any = {
      phase1_purge: {},
      phase2_discovery: {},
      phase3_content: {},
      phase4_posting: {},
      summary: {}
    };

    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // PHASE 1: PURGE MOCK DATA
    console.log('🧹 PHASE 1: Purging mock data...');
    const purgeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/system/purge-mock-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const purgeData = await purgeResponse.json();
    testResults.phase1_purge = purgeData.purged || {};

    // PHASE 2: DISCOVER REAL 2026 PRODUCTS
    console.log('🔍 PHASE 2: Discovering real 2026 products...');
    const discoveryResult = await trendingProductDiscovery.discoverAllTrendingProducts(userId);
    testResults.phase2_discovery = {
      productsFound: discoveryResult.total_found || 0,
      sources: ['Amazon', 'AliExpress', 'Google Trends', 'Curated 2026']
    };

    // PHASE 3: GENERATE REAL CONTENT
    console.log('✍️ PHASE 3: Generating real content...');
    const { data: products } = await (supabase as any)
      .from('product_catalog')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', '2026-01-01')
      .limit(3);

    let contentGenerated = 0;
    if (products && products.length > 0) {
      for (const product of products) {
        const content = await realTrafficEngine.generateRealContent(product, 'pinterest');
        if (content && content.length > 50) {
          contentGenerated++;
        }
      }
    }
    testResults.phase3_content = {
      productsProcessed: products?.length || 0,
      contentGenerated
    };

    // PHASE 4: ATTEMPT REAL POSTING
    console.log('📤 PHASE 4: Attempting real posting...');
    const postingResult = await realTrafficEngine.executeRealWorkflow(userId);
    testResults.phase4_posting = postingResult;

    // SUMMARY
    testResults.summary = {
      mockDataRemoved: Object.values(testResults.phase1_purge).reduce((a: any, b: any) => a + b, 0),
      realProductsAdded: testResults.phase2_discovery.productsFound,
      realContentGenerated: testResults.phase3_content.contentGenerated,
      realPostsCreated: testResults.phase4_posting.realPosts,
      setupRequired: testResults.phase4_posting.requiresSetup,
      status: testResults.phase4_posting.realPosts > 0 ? 'WORKING' : 'NEEDS_API_SETUP'
    };

    console.log('✅ System test complete:', testResults.summary);

    return res.status(200).json({
      success: true,
      results: testResults,
      message: testResults.summary.status === 'WORKING' 
        ? 'System is working with real data!' 
        : 'Mock data purged. Real products added. API integrations needed for posting.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ System test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}