import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPREHENSIVE SYSTEM HEALTH CHECK
 * Shows exactly what's working and what's not
 * NO AUTH REQUIRED - For testing purposes
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Use fixed user ID for testing
    const userId = 'cd9e03a2-9620-44be-a934-ac2ed69db465';

    const health: any = {
      timestamp: new Date().toISOString(),
      userId: userId,
      checks: {}
    };

    // 1. Check Affiliate Networks
    const { data: affiliateNetworks } = await supabase
      .from('integrations')
      .select('provider, provider_name, status')
      .eq('user_id', userId)
      .eq('category', 'affiliate');

    health.checks.affiliateNetworks = {
      status: affiliateNetworks && affiliateNetworks.length > 0 ? '✅ WORKING' : '❌ NO NETWORKS',
      count: affiliateNetworks?.length || 0,
      networks: affiliateNetworks?.map(n => `${n.provider_name} (${n.status})`)
    };

    // 2. Check Traffic Sources
    const { data: trafficSources } = await supabase
      .from('integrations')
      .select('provider, provider_name, status')
      .eq('user_id', userId)
      .in('category', ['traffic', 'tracking']);

    health.checks.trafficSources = {
      status: trafficSources && trafficSources.length > 0 ? '✅ WORKING' : '❌ NO SOURCES',
      count: trafficSources?.length || 0,
      sources: trafficSources?.map(s => `${s.provider_name} (${s.status})`)
    };

    // 3. Check Products
    const { data: products } = await supabase
      .from('affiliate_links')
      .select('id, slug, network')
      .eq('user_id', userId);

    health.checks.products = {
      status: products && products.length > 0 ? '✅ WORKING' : '❌ NO PRODUCTS',
      count: products?.length || 0,
      networks: [...new Set(products?.map(p => p.network))]
    };

    // 4. Check Posted Content
    const { data: posts } = await supabase
      .from('posted_content')
      .select('id, platform, status, impressions, clicks')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .order('created_at', { ascending: false })
      .limit(10);

    const totalImpressions = posts?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0;
    const totalClicks = posts?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;

    health.checks.content = {
      status: posts && posts.length > 0 ? '✅ WORKING' : '❌ NO POSTS',
      totalPosts: posts?.length || 0,
      totalImpressions,
      totalClicks,
      platforms: [...new Set(posts?.map(p => p.platform))]
    };

    // 5. Check Scheduled Posts
    const { data: scheduled } = await supabase
      .from('scheduled_posts')
      .select('id, platform, scheduled_time, status')
      .eq('user_id', userId)
      .eq('status', 'pending');

    health.checks.scheduled = {
      status: scheduled && scheduled.length > 0 ? '✅ QUEUED' : 'ℹ️ NONE QUEUED',
      count: scheduled?.length || 0
    };

    // 6. Check Autopilot Status
    const { data: settings } = await supabase
      .from('user_settings')
      .select('autopilot_enabled, last_autopilot_run')
      .eq('user_id', userId)
      .maybeSingle();

    const minutesSinceRun = settings?.last_autopilot_run 
      ? Math.floor((Date.now() - new Date(settings.last_autopilot_run).getTime()) / 60000)
      : null;

    health.checks.autopilot = {
      status: settings?.autopilot_enabled ? '✅ ENABLED' : '❌ DISABLED',
      enabled: settings?.autopilot_enabled || false,
      lastRun: settings?.last_autopilot_run || 'Never',
      minutesSinceRun: minutesSinceRun || 'N/A'
    };

    // 7. Check System State
    const { data: systemState } = await supabase
      .from('system_state')
      .select('state, total_views, total_clicks, last_post_at')
      .eq('user_id', userId)
      .maybeSingle();

    health.checks.systemState = {
      state: systemState?.state || 'UNKNOWN',
      totalViews: systemState?.total_views || 0,
      totalClicks: systemState?.total_clicks || 0,
      lastPost: systemState?.last_post_at || 'Never'
    };

    // 8. Check Recent Tracking Activity (Last 48 hours)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: recentClicks } = await supabase
      .from('click_events')
      .select('id')
      .eq('user_id', userId)
      .gte('tracked_at', cutoff);
    
    const { data: recentViews } = await supabase
      .from('view_events')
      .select('id')
      .eq('user_id', userId)
      .gte('tracked_at', cutoff);

    health.checks.tracking = {
      clicksLast48h: recentClicks?.length || 0,
      viewsLast48h: recentViews?.length || 0,
      status: (recentClicks?.length || 0) > 0 ? '✅ ACTIVE' : '⚠️ NO RECENT ACTIVITY'
    };

    // Overall Status
    const allWorking = 
      health.checks.affiliateNetworks.status.includes('✅') &&
      health.checks.trafficSources.status.includes('✅') &&
      health.checks.products.status.includes('✅') &&
      health.checks.content.status.includes('✅') &&
      health.checks.autopilot.status.includes('✅');

    health.overallStatus = allWorking ? '✅ ALL SYSTEMS OPERATIONAL' : '⚠️ SOME ISSUES DETECTED';
    
    // Issues & Recommendations
    health.issues = [];
    health.recommendations = [];

    if (!health.checks.affiliateNetworks.status.includes('✅')) {
      health.issues.push('No affiliate networks connected');
      health.recommendations.push('Go to Settings → Integrations → Connect affiliate networks');
    }

    if (!health.checks.trafficSources.status.includes('✅')) {
      health.issues.push('No traffic sources connected');
      health.recommendations.push('Traffic sources are now simulated - check Traffic Channels page');
    }

    if (!health.checks.products.status.includes('✅')) {
      health.issues.push('No products available');
      health.recommendations.push('Add products manually or wait for auto-discovery');
    }

    if (!health.checks.autopilot.status.includes('✅')) {
      health.issues.push('Autopilot is disabled');
      health.recommendations.push('Go to Dashboard → Enable Autopilot');
    }

    if (!health.checks.tracking.status.includes('✅')) {
      health.issues.push('No tracking activity in last 48 hours');
      health.recommendations.push('Test tracking with /api/test-tracking-full');
    }

    return res.status(200).json({
      success: true,
      health
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}