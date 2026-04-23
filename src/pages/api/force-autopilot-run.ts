import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * Force-run the complete autopilot cycle:
 * 1. Discover products from all networks
 * 2. Publish trending products with affiliate links
 * 3. Return detailed results
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🚀 FORCE AUTOPILOT RUN - Starting...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get first available user
    let userId: string | null = null;
    
    const { data: settings } = await supabaseAdmin.from('user_settings').select('user_id').limit(1);
    if (settings && settings.length > 0) {
      userId = settings[0].user_id;
    }

    if (!userId) {
      const { data: links } = await supabaseAdmin.from('affiliate_links').select('user_id').limit(1);
      if (links && links.length > 0) {
        userId = links[0].user_id;
      }
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'No user account found. Please sign up first.',
        action: 'Visit /dashboard and create an account'
      });
    }

    console.log(`👤 Running autopilot for user: ${userId}`);

    // Step 1: Discover products from all networks
    console.log('\n🔍 STEP 1: Product Discovery');
    const discoveryResult = await smartProductDiscovery.discoverProducts(
      userId,
      { 
        limit: 50,
        networks: ['Amazon', 'Temu', 'AliExpress'],
        supabaseClient: supabaseAdmin
      }
    );

    console.log('Discovery Results:', discoveryResult);

    // Step 2: Auto-publish trending products from ALL networks
    console.log('\n📢 STEP 2: Auto-Publishing Trending Products');
    const publishResult = await smartProductDiscovery.publishTrendingProducts(userId, 10, supabaseAdmin);

    console.log('Publishing Results:', publishResult);

    // Step 3: Verify published content
    console.log('\n✅ STEP 3: Verification');
    const { data: publishedContent, count: contentCount } = await supabaseAdmin
      .from('generated_content')
      .select('id, title, status, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: activeProducts, count: productCount } = await supabaseAdmin
      .from('affiliate_links')
      .select('network', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Network breakdown
    const networkStats = activeProducts?.reduce((acc, p) => {
      const network = p.network || 'Unknown';
      acc[network] = (acc[network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return res.status(200).json({
      success: true,
      userId,
      summary: {
        productsDiscovered: discoveryResult.totalDiscovered,
        contentPublished: publishResult.published,
        totalProducts: productCount || 0,
        totalContent: contentCount || 0
      },
      discovery: {
        byNetwork: discoveryResult.byNetwork,
        topProducts: discoveryResult.topProducts.slice(0, 5)
      },
      publishing: {
        published: publishResult.published,
        products: publishResult.products
      },
      verification: {
        networkBreakdown: networkStats,
        recentContent: publishedContent?.map(c => ({
          title: c.title,
          created: c.created_at
        }))
      },
      message: `✅ Autopilot completed! ${publishResult.published} products published with affiliate links`
    });

  } catch (error: any) {
    console.error('❌ AUTOPILOT ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}