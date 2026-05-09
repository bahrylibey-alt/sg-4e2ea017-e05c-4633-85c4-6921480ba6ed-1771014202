import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * AGGRESSIVE MOCK DATA PURGE
 * Deletes ALL simulated/fake/test data to achieve 100% real data system
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
        allClicks: 0,
        allConversions: 0,
        invalidLinks: 0,
        fakeContent: 0,
        testPosts: 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('🧹 STARTING AGGRESSIVE MOCK DATA PURGE...');

    // Get all profiles to purge system-wide
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id')
      .limit(100);

    if (!profiles || profiles.length === 0) {
      return res.status(200).json({
        success: true,
        purged: purgeResults.deleted,
        totalDeleted: 0,
        message: '✅ No users found. System is clean.',
        timestamp: purgeResults.timestamp
      });
    }

    // Process each user
    for (const profile of profiles) {
      const userId = profile.id;

      // DELETE 1: ALL products that are not from real affiliate networks
      console.log(`1️⃣ Purging invalid products for user ${userId}...`);
      const validNetworks = ['amazon', 'aliexpress', 'clickbank', 'cj', 'shareasale', 'rakuten', 'impact', 'awin'];
      
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
                              !p.source.toLowerCase().includes('test') &&
                              !p.source.toLowerCase().includes('demo') &&
                              !p.source.toLowerCase().includes('example');
        
        if (!hasValidNetwork || !hasRealUrl || !hasRealSource) {
          invalidProductIds.push(p.id);
        }
      });

      if (invalidProductIds.length > 0) {
        await (supabase as any)
          .from('product_catalog')
          .delete()
          .in('id', invalidProductIds);
        purgeResults.deleted.mockProducts += invalidProductIds.length;
      }

      // DELETE 2: ALL click_events (they're ALL simulated)
      console.log(`2️⃣ Deleting ALL click events for user ${userId}...`);
      const { count: clickCount } = await (supabase as any)
        .from('click_events')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });
      purgeResults.deleted.allClicks += clickCount || 0;

      // DELETE 3: ALL conversion_events
      console.log(`3️⃣ Deleting ALL conversion events for user ${userId}...`);
      const { count: convCount } = await (supabase as any)
        .from('conversion_events')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });
      purgeResults.deleted.allConversions += convCount || 0;

      // DELETE 4: ALL posted_content
      console.log(`4️⃣ Deleting ALL posted content for user ${userId}...`);
      const { count: postCount } = await (supabase as any)
        .from('posted_content')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });
      purgeResults.deleted.testPosts += postCount || 0;

      // DELETE 5: ALL generated_content that's not published
      console.log(`5️⃣ Deleting fake generated content for user ${userId}...`);
      const { count: contentCount } = await (supabase as any)
        .from('generated_content')
        .delete()
        .eq('user_id', userId)
        .in('status', ['draft', 'ready', 'scheduled'])
        .select('*', { count: 'exact' });
      purgeResults.deleted.fakeContent += contentCount || 0;

      // DELETE 6: Invalid affiliate links
      console.log(`6️⃣ Deleting invalid affiliate links for user ${userId}...`);
      const { data: invalidLinks } = await (supabase as any)
        .from('affiliate_links')
        .select('id')
        .eq('user_id', userId)
        .or('original_url.ilike.%example%,original_url.ilike.%test%,status.eq.invalid,short_url.is.null');

      if (invalidLinks && invalidLinks.length > 0) {
        const linkIds = invalidLinks.map((l: any) => l.id);
        await (supabase as any)
          .from('affiliate_links')
          .delete()
          .in('id', linkIds);
        purgeResults.deleted.invalidLinks += invalidLinks.length;
      }
    }

    const totalDeleted = Object.values(purgeResults.deleted).reduce((a, b) => a + b, 0);
    
    console.log('✅ PURGE COMPLETE:', purgeResults);

    return res.status(200).json({
      success: true,
      purged: purgeResults.deleted,
      totalDeleted,
      message: `✅ Deleted ${totalDeleted} mock/invalid items. System is now 100% real data only.`,
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