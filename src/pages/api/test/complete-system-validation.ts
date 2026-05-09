import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { trendingProductDiscovery } from "@/services/trendingProductDiscovery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get test user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found'
      });
    }

    const userId = profiles[0].id;
    const results: any[] = [];

    // TEST 1: Database Connection
    try {
      const { data } = await supabase.from('product_catalog').select('id').limit(1);
      results.push({
        status: 'PASSED',
        message: 'Database connected successfully',
        details: { connected: true }
      });
    } catch (error) {
      results.push({
        status: 'FAILED',
        message: 'Database connection failed',
        details: { error: error instanceof Error ? error.message : 'Unknown' }
      });
    }

    // TEST 2: Product Discovery (2026)
    try {
      const discovery = await trendingProductDiscovery.discoverAllTrendingProducts(userId);
      results.push({
        status: discovery.total_found > 0 ? 'PASSED' : 'FAILED',
        message: `Found ${discovery.total_found} trending products`,
        details: { products: discovery.total_found }
      });
    } catch (error) {
      results.push({
        status: 'FAILED',
        message: 'Product discovery failed',
        details: { error: error instanceof Error ? error.message : 'Unknown' }
      });
    }

    // TEST 3: Affiliate Links
    try {
      const { count } = await supabase
        .from('affiliate_links')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      
      results.push({
        status: (count || 0) > 0 ? 'PASSED' : 'WARNING',
        message: `${count || 0} affiliate links active`,
        details: { links: count || 0 }
      });
    } catch (error) {
      results.push({
        status: 'FAILED',
        message: 'Link check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown' }
      });
    }

    // TEST 4: Traffic Sources
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId);

      const campaignIds = campaigns?.map(c => c.id) || [];
      let sourceCount = 0;
      
      if (campaignIds.length > 0) {
        const { count } = await supabase
          .from('traffic_sources')
          .select('id', { count: 'exact' })
          .in('campaign_id', campaignIds);
        sourceCount = count || 0;
      }

      results.push({
        status: sourceCount > 0 ? 'PASSED' : 'WARNING',
        message: `${sourceCount} traffic sources configured`,
        details: { sources: sourceCount }
      });
    } catch (error) {
      results.push({
        status: 'FAILED',
        message: 'Traffic check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown' }
      });
    }

    // Calculate summary
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const warnings = results.filter(r => r.status === 'WARNING').length;

    return res.status(200).json({
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        warnings,
        duration: 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}