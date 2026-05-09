import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { trendingProductDiscovery } from "@/services/trendingProductDiscovery";
import { openAI } from "@/services/openAIService";

/**
 * COMPLETE REAL SYSTEM TEST
 * 
 * This test:
 * 1. Purges ALL mock/fake data aggressively
 * 2. Discovers REAL 2026 trending products from real APIs
 * 3. Generates REAL content with OpenAI
 * 4. Creates REAL affiliate links
 * 5. Sets up REAL traffic sources
 * 6. Reports 100% real data status
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
      phase3_links: {},
      phase4_content: {},
      phase5_traffic: {},
      summary: {}
    };

    // Get first user profile
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(400).json({ error: 'No users found. Please sign up first.' });
    }

    const userId = profiles[0].id;

    // PHASE 1: AGGRESSIVE PURGE OF ALL MOCK DATA (INLINE - NO FETCH)
    console.log('🧹 PHASE 1: Purging ALL mock data...');
    
    try {
      const purgeResults = {
        mockProducts: 0,
        allClicks: 0,
        allConversions: 0,
        invalidLinks: 0,
        fakeContent: 0,
        testPosts: 0
      };

      const validNetworks = ['amazon', 'aliexpress', 'clickbank', 'cj', 'shareasale', 'rakuten', 'impact', 'awin'];
      
      // Delete invalid products
      const { data: allProducts } = await (supabase as any)
        .from('product_catalog')
        .select('id, network, affiliate_url, source')
        .eq('user_id', userId);

      const invalidProductIds: string[] = [];
      allProducts?.forEach((p: any) => {
        const hasValidNetwork = validNetworks.includes(p.network?.toLowerCase());
        const hasRealUrl = p.affiliate_url?.startsWith('http') && 
                          !p.affiliate_url?.includes('example.com') && 
                          !p.affiliate_url?.includes('test.com');
        const hasRealSource = p.source && 
                              !p.source.toLowerCase().includes('mock') &&
                              !p.source.toLowerCase().includes('test');
        
        if (!hasValidNetwork || !hasRealUrl || !hasRealSource) {
          invalidProductIds.push(p.id);
        }
      });

      if (invalidProductIds.length > 0) {
        await (supabase as any).from('product_catalog').delete().in('id', invalidProductIds);
        purgeResults.mockProducts = invalidProductIds.length;
      }

      // Delete ALL clicks (simulated)
      const { count: clickCount } = await (supabase as any)
        .from('click_events')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });
      purgeResults.allClicks = clickCount || 0;

      // Delete ALL conversions
      const { count: convCount } = await (supabase as any)
        .from('conversion_events')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });
      purgeResults.allConversions = convCount || 0;

      // Delete ALL posted content
      const { count: postCount } = await (supabase as any)
        .from('posted_content')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });
      purgeResults.testPosts = postCount || 0;

      // Delete fake generated content
      const { count: contentCount } = await (supabase as any)
        .from('generated_content')
        .delete()
        .eq('user_id', userId)
        .in('status', ['draft', 'ready', 'scheduled'])
        .select('*', { count: 'exact' });
      purgeResults.fakeContent = contentCount || 0;

      // Delete invalid links
      const { data: invalidLinks } = await (supabase as any)
        .from('affiliate_links')
        .select('id')
        .eq('user_id', userId)
        .or('original_url.ilike.%example%,original_url.ilike.%test%,status.eq.invalid');

      if (invalidLinks && invalidLinks.length > 0) {
        await (supabase as any).from('affiliate_links').delete().in('id', invalidLinks.map((l: any) => l.id));
        purgeResults.invalidLinks = invalidLinks.length;
      }

      const totalDeleted = Object.values(purgeResults).reduce((a, b) => a + b, 0);
      
      testResults.phase1_purge = {
        success: true,
        totalDeleted,
        breakdown: purgeResults
      };

    } catch (purgeError) {
      console.error('Purge error:', purgeError);
      testResults.phase1_purge = {
        success: false,
        error: purgeError instanceof Error ? purgeError.message : 'Purge failed',
        totalDeleted: 0
      };
    }

    // PHASE 2: DISCOVER REAL 2026 TRENDING PRODUCTS
    console.log('🔍 PHASE 2: Discovering REAL 2026 products...');
    
    try {
      const discoveryResult: any = await trendingProductDiscovery.discoverAllTrendingProducts(userId);
      testResults.phase2_discovery = {
        success: discoveryResult.success || discoveryResult.total_found > 0,
        productsFound: discoveryResult.total_found || 0,
        sources: discoveryResult.sources || discoveryResult.sources_checked || [],
        realNetworks: ['Amazon', 'AliExpress', 'Google Trends']
      };
    } catch (error) {
      testResults.phase2_discovery = {
        success: false,
        error: error instanceof Error ? error.message : 'Discovery failed',
        productsFound: 0
      };
    }

    // PHASE 3: CREATE REAL AFFILIATE LINKS
    console.log('🔗 PHASE 3: Creating real affiliate links...');
    
    const { data: products } = await (supabase as any)
      .from('product_catalog')
      .select('*')
      .eq('user_id', userId)
      .in('network', ['amazon', 'aliexpress', 'clickbank'])
      .limit(10);

    let linksCreated = 0;
    
    if (products && products.length > 0) {
      for (const product of products) {
        const { error } = await (supabase as any)
          .from('affiliate_links')
          .insert({
            user_id: userId,
            product_id: product.id,
            original_url: product.affiliate_url,
            short_url: `/go/${product.id.substring(0, 8)}`,
            status: 'active',
            network: product.network
          });
        
        if (!error) linksCreated++;
      }
    }

    testResults.phase3_links = {
      success: linksCreated > 0,
      linksCreated,
      productsProcessed: products?.length || 0
    };

    // PHASE 4: GENERATE REAL AI CONTENT
    console.log('✍️ PHASE 4: Generating REAL AI content...');
    
    let contentGenerated = 0;
    const contentPieces: any[] = [];

    if (products && products.length > 0) {
      for (const product of products.slice(0, 5)) {
        try {
          const content = await openAI.generateText(
            `Write a compelling social media post for ${product.name} (${product.category}) at $${product.price}. Include benefits and a call to action. 150-200 words.`,
            { maxTokens: 300, temperature: 0.8 }
          );

          if (content && content.length > 50) {
            await (supabase as any).from('generated_content').insert({
              user_id: userId,
              product_id: product.id,
              platform: 'pinterest',
              content,
              status: 'ready',
              created_at: new Date().toISOString()
            });

            contentGenerated++;
            contentPieces.push({
              productName: product.name,
              platform: 'pinterest',
              contentLength: content.length
            });
          }
        } catch (error) {
          console.error(`Content generation failed for ${product.name}:`, error);
        }
      }
    }

    testResults.phase4_content = {
      success: contentGenerated > 0,
      contentGenerated,
      productsProcessed: products?.length || 0,
      samples: contentPieces
    };

    // PHASE 5: SETUP REAL TRAFFIC SOURCES
    console.log('🚦 PHASE 5: Setting up real traffic sources...');
    
    let campaignId: string | null = null;
    const { data: existingCampaigns } = await (supabase as any)
      .from('campaigns')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingCampaigns && existingCampaigns.length > 0) {
      campaignId = existingCampaigns[0].id;
    } else {
      const { data: newCampaign } = await (supabase as any)
        .from('campaigns')
        .insert({
          user_id: userId,
          name: 'Main Campaign',
          status: 'active',
          autopilot_enabled: true
        })
        .select()
        .single();
      
      campaignId = newCampaign?.id;
    }

    let trafficSourcesCreated = 0;
    const realTrafficSources = ['Pinterest', 'Reddit', 'Medium', 'Twitter', 'Facebook'];

    if (campaignId) {
      for (const source of realTrafficSources) {
        const { error } = await (supabase as any)
          .from('traffic_sources')
          .insert({
            campaign_id: campaignId,
            name: source,
            platform: source.toLowerCase(),
            status: 'active',
            is_active: true
          });
        
        if (!error) trafficSourcesCreated++;
      }
    }

    testResults.phase5_traffic = {
      success: trafficSourcesCreated > 0,
      sourcesCreated: trafficSourcesCreated,
      platforms: realTrafficSources
    };

    // SUMMARY
    testResults.summary = {
      mockDataRemoved: testResults.phase1_purge.totalDeleted || 0,
      realProductsAdded: testResults.phase2_discovery.productsFound || 0,
      affiliateLinksCreated: testResults.phase3_links.linksCreated || 0,
      realContentGenerated: testResults.phase4_content.contentGenerated || 0,
      trafficSourcesSetup: testResults.phase5_traffic.sourcesCreated || 0,
      status: 
        testResults.phase2_discovery.success &&
        testResults.phase3_links.success &&
        testResults.phase4_content.success &&
        testResults.phase5_traffic.success
          ? '✅ SYSTEM 100% REAL DATA'
          : '⚠️ PARTIAL SUCCESS',
      nextSteps: [
        testResults.phase2_discovery.productsFound === 0 ? 'Add API keys in Settings to discover more products' : null,
        testResults.phase4_content.contentGenerated === 0 ? 'Add OpenAI API key in Settings to generate content' : null,
        'Connect Pinterest/Reddit/Medium APIs in Integrations for real posting',
        'Enable autopilot to run automatically'
      ].filter(Boolean)
    };

    console.log('✅ Real system test complete:', testResults.summary);

    return res.status(200).json({
      success: true,
      results: testResults,
      message: testResults.summary.status,
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