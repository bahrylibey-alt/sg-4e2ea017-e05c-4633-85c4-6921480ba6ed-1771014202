import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * Manual trigger for cross-network product discovery
 * Discovers products from Amazon, Temu, AliExpress and auto-publishes trending ones
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🚀 MANUAL PRODUCT DISCOVERY TRIGGER');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get any active user ID from the database using user_settings to bypass auth.admin requirements
    let userId: string | null = null;
    
    const { data: settings } = await supabaseAdmin.from('user_settings').select('user_id').limit(1);
    if (settings && settings.length > 0) {
      userId = settings[0].user_id;
    }

    if (!userId) {
      // Fallback: check if we have any user who created links
      const { data: links } = await supabaseAdmin.from('affiliate_links').select('user_id').limit(1);
      if (links && links.length > 0) {
         userId = links[0].user_id;
      }
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'No active user accounts found in the database. Please log in through the frontend dashboard to initialize the system.'
      });
    }

    console.log(`👤 Bound to User ID: ${userId}`);

    // Discover products from ALL networks
    const discoveryResult = await smartProductDiscovery.discoverProducts(
      userId,
      { 
        limit: 50,
        networks: ['Amazon', 'Temu', 'AliExpress']
      }
    );

    console.log('\n📊 DISCOVERY RESULTS:');
    console.log(`Total Discovered: ${discoveryResult.totalDiscovered}`);
    console.log('By Network:', discoveryResult.byNetwork);

    // Auto-publish trending products
    const publishResult = await smartProductDiscovery.publishTrendingProducts(userId, 5);

    console.log('\n📢 PUBLISHING RESULTS:');
    console.log(`Published: ${publishResult.published}`);
    console.log('Products:', publishResult.products);

    return res.status(200).json({
      success: true,
      discovery: {
        total: discoveryResult.totalDiscovered,
        byNetwork: discoveryResult.byNetwork,
        topProducts: discoveryResult.topProducts
      },
      publishing: {
        published: publishResult.published,
        products: publishResult.products
      }
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}