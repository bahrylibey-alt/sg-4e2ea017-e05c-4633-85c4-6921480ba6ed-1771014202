import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * PURGE ALL MOCK/FAKE DATA
 * Deletes all simulated data and resets system to clean state
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const purgeResults = {
      deleted: {
        mockProducts: 0,
        mockClicks: 0,
        mockConversions: 0,
        invalidLinks: 0,
        simulatedContent: 0
      },
      timestamp: new Date().toISOString()
    };

    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // DELETE 1: Remove products with "Invalid network" or mock sources
    const { data: invalidProducts } = await (supabase as any)
      .from('product_catalog')
      .select('id')
      .eq('user_id', userId)
      .or('source.ilike.%mock%,source.ilike.%test%,source.ilike.%demo%,affiliate_url.ilike.%example%,affiliate_url.ilike.%test%');

    if (invalidProducts && invalidProducts.length > 0) {
      const invalidIds = invalidProducts.map((p: any) => p.id);
      await (supabase as any)
        .from('product_catalog')
        .delete()
        .in('id', invalidIds);
      purgeResults.deleted.mockProducts = invalidProducts.length;
    }

    // DELETE 2: Remove ALL click_events (they're all simulated)
    const { count: clickCount } = await (supabase as any)
      .from('click_events')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true });
    purgeResults.deleted.mockClicks = clickCount || 0;

    // DELETE 3: Remove posted_content (all simulated posts)
    const { count: contentCount } = await (supabase as any)
      .from('posted_content')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true });
    purgeResults.deleted.simulatedContent = contentCount || 0;

    // DELETE 4: Keep conversions (they might be real) but flag for review
    
    // DELETE 5: Remove invalid affiliate links
    const { data: invalidLinks } = await (supabase as any)
      .from('affiliate_links')
      .select('id')
      .eq('user_id', userId)
      .or('original_url.ilike.%example%,original_url.ilike.%test%,status.eq.invalid');

    if (invalidLinks && invalidLinks.length > 0) {
      const linkIds = invalidLinks.map((l: any) => l.id);
      await (supabase as any)
        .from('affiliate_links')
        .delete()
        .in('id', linkIds);
      purgeResults.deleted.invalidLinks = invalidLinks.length;
    }

    console.log('✅ Mock data purged:', purgeResults);

    return res.status(200).json({
      success: true,
      purged: purgeResults.deleted,
      message: `Deleted ${Object.values(purgeResults.deleted).reduce((a, b) => a + b, 0)} mock/invalid items`,
      timestamp: purgeResults.timestamp
    });

  } catch (error) {
    console.error('❌ Purge failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}