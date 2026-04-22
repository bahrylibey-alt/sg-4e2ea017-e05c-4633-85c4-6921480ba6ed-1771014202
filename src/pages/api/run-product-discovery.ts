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

    // Must use Service Role key to list users, ANON key will get 401 Unauthorized
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get first user
    const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error("Auth Admin Error:", authError.message);
    }
    
    let userId = users?.users?.[0]?.id;

    if (!userId) {
      // If still no user, auto-create a system user to allow the discovery engine to run
      console.log("No users found, creating system user to bind products...");
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
          email: 'system@autopilot.local',
          password: 'SystemPassword123!',
          email_confirm: true
        });
        if (newUser.user) {
          userId = newUser.user.id;
          console.log(`✅ Created system user: ${userId}`);
        }
      }
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'No users found and failed to auto-create. Please sign up first.'
        });
      }
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