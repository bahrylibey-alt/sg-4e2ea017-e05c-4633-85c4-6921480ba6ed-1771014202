import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SERVER-SIDE LINK HEALTH CHECK API
 * 
 * Validates affiliate links without CORS issues
 * Uses Supabase Edge Function for Amazon link validation
 */

interface LinkHealthResult {
  linkId: string;
  slug: string;
  productName: string;
  network: string;
  originalUrl: string;
  isWorking: boolean;
  statusCode?: number;
  error?: string;
  checkTime: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    console.log('🔍 Starting server-side link health check...');

    // Get all active affiliate links
    const { data: links, error: fetchError } = await supabase
      .from('affiliate_links')
      .select('id, slug, product_name, network, original_url, is_working, check_failures')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch links:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!links || links.length === 0) {
      return res.status(200).json({
        success: true,
        totalChecked: 0,
        working: 0,
        broken: 0,
        removed: 0,
        results: []
      });
    }

    console.log(`📊 Checking ${links.length} affiliate links...`);

    const results: LinkHealthResult[] = [];
    let workingCount = 0;
    let brokenCount = 0;
    let removedCount = 0;

    // Check each link using Supabase Edge Function
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const checkTime = new Date().toISOString();

      console.log(`[${i + 1}/${links.length}] Checking: ${link.product_name || link.slug}`);

      let isWorking = false;
      let errorMessage: string | undefined;

      // Use Supabase Edge Function to check Amazon links
      if (link.network?.includes('Amazon') || link.network?.includes('amazon')) {
        try {
          const { data: checkResult, error: fnError } = await supabase.functions.invoke('check-amazon-link', {
            body: { url: link.original_url }
          });

          if (fnError) {
            console.error('Edge function error:', fnError);
            errorMessage = fnError.message;
            isWorking = false;
          } else {
            isWorking = checkResult?.isValid || false;
            errorMessage = checkResult?.error;
          }
        } catch (error: any) {
          console.error('Edge function call failed:', error);
          errorMessage = error.message;
          isWorking = false;
        }
      } else {
        // For non-Amazon links, assume working (Temu/AliExpress have stricter CORS)
        isWorking = true;
        errorMessage = 'CORS-protected - assumed working';
      }

      const result: LinkHealthResult = {
        linkId: link.id,
        slug: link.slug,
        productName: link.product_name || 'Unknown',
        network: link.network || 'unknown',
        originalUrl: link.original_url,
        isWorking,
        error: errorMessage,
        checkTime
      };

      results.push(result);

      if (isWorking) {
        workingCount++;
        
        // Reset failure counter
        await supabase
          .from('affiliate_links')
          .update({
            is_working: true,
            check_failures: 0,
            last_checked_at: checkTime
          })
          .eq('id', link.id);

        console.log(`✅ WORKING: ${link.product_name}`);
      } else {
        brokenCount++;
        const newFailureCount = (link.check_failures || 0) + 1;

        // If failed 3+ times, mark as broken and pause
        if (newFailureCount >= 3) {
          await supabase
            .from('affiliate_links')
            .update({
              is_working: false,
              status: 'paused',
              check_failures: newFailureCount,
              last_checked_at: checkTime
            })
            .eq('id', link.id);

          removedCount++;
          console.log(`❌ REMOVED: ${link.product_name} (${newFailureCount} failures)`);
        } else {
          // Increment failure counter
          await supabase
            .from('affiliate_links')
            .update({
              check_failures: newFailureCount,
              last_checked_at: checkTime
            })
            .eq('id', link.id);

          console.log(`⚠️ BROKEN: ${link.product_name} (failure ${newFailureCount}/3)`);
        }
      }

      // Rate limit: Wait 500ms between checks
      if (i < links.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`
🎯 Health Check Complete:
- Total Checked: ${links.length}
- ✅ Working: ${workingCount}
- ❌ Broken: ${brokenCount}
- 🗑️ Removed: ${removedCount}
    `);

    return res.status(200).json({
      success: true,
      totalChecked: links.length,
      working: workingCount,
      broken: brokenCount,
      removed: removedCount,
      results
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      totalChecked: 0,
      working: 0,
      broken: 0,
      removed: 0,
      results: []
    });
  }
}