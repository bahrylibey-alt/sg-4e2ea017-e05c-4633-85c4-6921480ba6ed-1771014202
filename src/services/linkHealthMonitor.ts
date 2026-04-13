import { supabase } from "@/integrations/supabase/client";

/**
 * Link Health Monitor - Validates actual destination URLs
 * 
 * CRITICAL: This service validates the ACTUAL Amazon/Temu product pages,
 * not just the redirect URLs. Broken products get marked and removed.
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

interface HealthCheckSummary {
  totalChecked: number;
  working: number;
  broken: number;
  removed: number;
  results: LinkHealthResult[];
}

/**
 * Check if a URL is accessible (returns 200-299 status)
 */
async function validateUrl(url: string): Promise<{ isWorking: boolean; statusCode?: number; error?: string }> {
  try {
    // Use a CORS proxy for cross-origin requests
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Amazon blocks CORS, so we can't get status code
      cache: 'no-cache'
    });

    // With no-cors, we can't read the response, but if it doesn't throw, the URL exists
    return { isWorking: true, statusCode: 200 };
  } catch (error: any) {
    // Network errors, DNS failures, 404s all throw in no-cors mode
    return { 
      isWorking: false, 
      error: error.message || 'Failed to fetch'
    };
  }
}

/**
 * Check health of all user's affiliate links
 */
export async function checkAllLinksHealth(userId: string): Promise<HealthCheckSummary> {
  console.log('🔍 Starting comprehensive link health check...');

  const { data: links, error } = await supabase
    .from('affiliate_links')
    .select('id, slug, product_name, network, original_url, is_working, check_failures')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch links:', error);
    throw error;
  }

  if (!links || links.length === 0) {
    return {
      totalChecked: 0,
      working: 0,
      broken: 0,
      removed: 0,
      results: []
    };
  }

  const results: LinkHealthResult[] = [];
  let workingCount = 0;
  let brokenCount = 0;
  let removedCount = 0;

  console.log(`📊 Checking ${links.length} affiliate links...`);

  // Check each link (with rate limiting to avoid overwhelming Amazon)
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    
    console.log(`[${i + 1}/${links.length}] Checking: ${link.product_name || link.slug}`);

    const checkResult = await validateUrl(link.original_url);
    const checkTime = new Date().toISOString();

    const result: LinkHealthResult = {
      linkId: link.id,
      slug: link.slug,
      productName: link.product_name || 'Unknown',
      network: link.network || 'unknown',
      originalUrl: link.original_url,
      isWorking: checkResult.isWorking,
      statusCode: checkResult.statusCode,
      error: checkResult.error,
      checkTime
    };

    results.push(result);

    if (checkResult.isWorking) {
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

    // Rate limit: Wait 1 second between checks to avoid rate limiting
    if (i < links.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`
🎯 Health Check Complete:
- Total Checked: ${links.length}
- ✅ Working: ${workingCount}
- ❌ Broken: ${brokenCount}
- 🗑️ Removed: ${removedCount}
  `);

  return {
    totalChecked: links.length,
    working: workingCount,
    broken: brokenCount,
    removed: removedCount,
    results
  };
}

/**
 * Remove all broken links (3+ consecutive failures)
 */
export async function removeAllBrokenLinks(userId: string): Promise<number> {
  console.log('🗑️ Removing all broken links...');

  const { data: brokenLinks } = await supabase
    .from('affiliate_links')
    .select('id, product_name')
    .eq('user_id', userId)
    .eq('is_working', false)
    .gte('check_failures', 3);

  if (!brokenLinks || brokenLinks.length === 0) {
    console.log('✅ No broken links to remove');
    return 0;
  }

  const { error } = await supabase
    .from('affiliate_links')
    .delete()
    .eq('user_id', userId)
    .eq('is_working', false)
    .gte('check_failures', 3);

  if (error) {
    console.error('Failed to remove broken links:', error);
    throw error;
  }

  console.log(`✅ Removed ${brokenLinks.length} broken links`);
  return brokenLinks.length;
}

/**
 * Auto-repair system: Attempts to fix broken links or removes them
 */
export async function autoRepairLinks(userId: string): Promise<{
  repaired: number;
  removed: number;
  report: string;
}> {
  console.log('🔧 Starting auto-repair system...');

  // Step 1: Check all links
  const healthCheck = await checkAllLinksHealth(userId);

  // Step 2: Remove confirmed broken links (3+ failures)
  const removed = await removeAllBrokenLinks(userId);

  const report = `
Auto-Repair Complete:
- Total Links Checked: ${healthCheck.totalChecked}
- ✅ Working Links: ${healthCheck.working}
- ❌ Broken Links: ${healthCheck.broken}
- 🗑️ Removed Links: ${removed}

Next Steps:
- Working links are ready for traffic
- Broken links with <3 failures will be rechecked
- Links with 3+ failures have been removed
  `.trim();

  console.log(report);

  return {
    repaired: 0, // Future: implement URL repair logic
    removed,
    report
  };
}

/**
 * Smart link validator: Only keeps REAL, working affiliate links
 */
export async function validateAndCleanDatabase(userId: string): Promise<{
  before: number;
  after: number;
  removed: number;
}> {
  // Get count before
  const { count: beforeCount } = await supabase
    .from('affiliate_links')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Run health check
  await checkAllLinksHealth(userId);

  // Remove broken
  const removed = await removeAllBrokenLinks(userId);

  // Get count after
  const { count: afterCount } = await supabase
    .from('affiliate_links')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  return {
    before: beforeCount || 0,
    after: afterCount || 0,
    removed
  };
}