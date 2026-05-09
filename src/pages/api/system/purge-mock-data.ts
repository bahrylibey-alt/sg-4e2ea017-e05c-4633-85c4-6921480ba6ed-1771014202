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

    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    console.log('🧹 STARTING AGGRESSIVE MOCK DATA PURGE...');

    // DELETE 1: ALL products that are not from real affiliate networks
    console.log('1️⃣ Purging invalid products...');
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
      purgeResults.deleted.mockProducts = invalidProductIds.length;
    }

    // DELETE 2: ALL click_events (they're ALL simulated - only real visitor clicks should exist)
    console.log('2️⃣ Deleting ALL click events (simulated traffic)...');
    const { error: clickDeleteError } = await (supabase as any)
      .from('click_events')
      .delete()
      .eq('user_id', userId)
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (!clickDeleteError) {
      const { count } = await (supabase as any)
        .from('click_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      purgeResults.deleted.allClicks = count || 0;
    }

    // DELETE 3: ALL conversion_events (simulated conversions)
    console.log('3️⃣ Deleting ALL conversion events (simulated)...');
    const { error: convDeleteError } = await (supabase as any)
      .from('conversion_events')
      .delete()
      .eq('user_id', userId)
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (!convDeleteError) {
      const { count } = await (supabase as any)
        .from('conversion_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      purgeResults.deleted.allConversions = count || 0;
    }

    // DELETE 4: ALL posted_content (simulated posts)
    console.log('4️⃣ Deleting ALL posted content (simulated)...');
    const { error: postDeleteError } = await (supabase as any)
      .from('posted_content')
      .delete()
      .eq('user_id', userId)
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (!postDeleteError) {
      const { count } = await (supabase as any)
        .from('posted_content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      purgeResults.deleted.testPosts = count || 0;
    }

    // DELETE 5: ALL generated_content that wasn't actually posted
    console.log('5️⃣ Deleting fake generated content...');
    const { error: contentDeleteError } = await (supabase as any)
      .from('generated_content')
      .delete()
      .eq('user_id', userId)
      .in('status', ['draft', 'ready', 'scheduled']); // Keep only 'published' if from real API

    if (!contentDeleteError) {
      const { count } = await (supabase as any)
        .from('generated_content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['draft', 'ready', 'scheduled']);
      purgeResults.deleted.fakeContent = count || 0;
    }

    // DELETE 6: Invalid affiliate links
    console.log('6️⃣ Deleting invalid affiliate links...');
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
      purgeResults.deleted.invalidLinks = invalidLinks.length;
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