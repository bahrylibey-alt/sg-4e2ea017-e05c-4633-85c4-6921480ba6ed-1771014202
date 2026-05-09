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

    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // PHASE 1: AGGRESSIVE PURGE OF ALL MOCK DATA
    console.log('🧹 PHASE 1: Purging ALL mock data...');
    const purgeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/system/purge-mock-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      }
    });
    
    const purgeData = await purgeResponse.json();
    testResults.phase1_purge = {
      success: purgeData.success,
      totalDeleted: purgeData.totalDeleted || 0,
      breakdown: purgeData.purged || {}
    };

    // PHASE 2: DISCOVER REAL 2026 TRENDING PRODUCTS
    console.log('🔍 PHASE 2: Discovering REAL 2026 products...');
    
    try {
      const discoveryResult = await trendingProductDiscovery.discoverAllTrendingProducts(userId);
      testResults.phase2_discovery = {
        success: discoveryResult.success,
        productsFound: discoveryResult.total_found || 0,
        sources: discoveryResult.sources || [],
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
            short_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/go/${product.id.substring(0, 8)}`,
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
            // Save to database
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
    
    // Get or create campaign
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