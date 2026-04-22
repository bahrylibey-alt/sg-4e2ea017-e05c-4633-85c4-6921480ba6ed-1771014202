import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
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

    // Get first user
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (!users || users.users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users found. Please sign up first.'
      });
    }

    const userId = users.users[0].id;
    console.log(`👤 User ID: ${userId}`);

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