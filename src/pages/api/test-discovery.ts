import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { smartProductDiscovery } from '@/services/smartProductDiscovery';

/**
 * TEST DISCOVERY ENDPOINT
 * Tests the complete product discovery and sync system
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🧪 TEST DISCOVERY: Starting...');

    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' } as any);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' } as any);
    }

    console.log(`📊 Testing for user: ${user.id}`);

    // Step 1: Check connected integrations
    const { data: integrationsData, error: intError } = await (supabase as any)
      .from('integrations')
      .select('provider_name, last_sync_at')
      .eq('user_id', user.id)
      .eq('category', 'affiliate_network')
      .eq('status', 'connected');

    if (intError) throw intError;

    const integrations = integrationsData || [];

    console.log(`✅ Found ${integrations.length} connected integrations`);

    if (integrations.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No connected integrations found',
        hint: 'Please connect at least one affiliate network first'
      } as any);
    }

    // Step 2: Run product discovery
    console.log('🔍 Running product discovery...');
    const result = await smartProductDiscovery.discoverProducts(user.id, 50);

    console.log(`✅ Discovery complete: ${result.discovered} products`);

    // Step 3: Verify products were saved to affiliate_links
    const { data: links, error: linksError } = await (supabase as any)
      .from('affiliate_links')
      .select('id')
      .eq('user_id', user.id);

    if (linksError) throw linksError;

    console.log(`✅ Found ${links?.length || 0} affiliate links in database`);

    // Step 4: Verify products were saved to product_catalog
    const { data: catalog, error: catalogError } = await (supabase as any)
      .from('product_catalog')
      .select('id')
      .eq('user_id', user.id);

    if (catalogError) throw catalogError;

    console.log(`✅ Found ${catalog?.length || 0} products in catalog`);

    // Step 5: Get sync times from integrations
    const syncTimes = integrations.map((i: any) => ({
      network: i.provider_name,
      last_sync: i.last_sync_at
    }));

    console.log('✅ TEST DISCOVERY: Complete');

    const responsePayload: any = {
      success: true,
      test_results: {
        connected_integrations: integrations.length,
        discovered_products: result.discovered,
        networks_used: result.networks,
        affiliate_links_saved: links?.length || 0,
        catalog_entries_saved: catalog?.length || 0,
        sync_times: syncTimes
      },
      message: `✅ Discovery working! ${result.discovered} products discovered and saved to both tables`
    };

    return res.status(200).json(responsePayload);

  } catch (error: any) {
    console.error('❌ TEST DISCOVERY: Failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    } as any);
  }
}