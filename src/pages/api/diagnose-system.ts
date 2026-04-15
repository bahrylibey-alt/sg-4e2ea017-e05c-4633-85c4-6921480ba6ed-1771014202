import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPREHENSIVE SYSTEM DIAGNOSTIC
 * Tests ALL components and identifies issues
 * NO AUTH REQUIRED - For testing purposes
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    userId: 'cd9e03a2-9620-44be-a934-ac2ed69db465',
    environment: {},
    database: {},
    tracking: {},
    automation: {},
    issues: [],
    recommendations: []
  };

  try {
    const userId = diagnostics.userId;

    // 1. ENVIRONMENT CHECK
    diagnostics.environment = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      cronSecret: !!process.env.CRON_SECRET,
      nodeEnv: process.env.NODE_ENV
    };

    if (!process.env.CRON_SECRET) {
      diagnostics.issues.push("❌ CRON_SECRET missing - cron jobs will fail authentication");
      diagnostics.recommendations.push("Add CRON_SECRET to .env.local");
    }

    // 2. DATABASE CHECK
    const { data: profiles } = await supabase.from('profiles').select('id, email');
    const { data: products } = await supabase.from('affiliate_links').select('id, network').eq('user_id', userId);
    const { data: integrations } = await supabase.from('integrations').select('provider, status, category').eq('user_id', userId);
    const { data: systemState } = await supabase.from('system_state').select('*').eq('user_id', userId).maybeSingle();

    const affiliateNetworks = integrations?.filter(i => i.category === 'affiliate') || [];
    const trafficSources = integrations?.filter(i => i.category === 'tracking') || [];

    diagnostics.database = {
      totalUsers: profiles?.length || 0,
      totalProducts: products?.length || 0,
      affiliateNetworks: affiliateNetworks.length,
      trafficSources: trafficSources.length,
      affiliateList: affiliateNetworks.map(i => `${i.provider}:${i.status}`),
      trafficList: trafficSources.map(i => `${i.provider}:${i.status}`),
      systemState: systemState || null
    };

    if (!profiles?.length) {
      diagnostics.issues.push("❌ No users found - system has no users");
    }
    if (!products?.length) {
      diagnostics.issues.push("⚠️ No products in catalog");
      diagnostics.recommendations.push("Run product discovery or add products manually");
    }
    if (!affiliateNetworks.length) {
      diagnostics.issues.push("❌ No affiliate networks connected");
      diagnostics.recommendations.push("Connect affiliate networks in Settings → Integrations");
    }
    if (!trafficSources.length) {
      diagnostics.issues.push("⚠️ No traffic sources connected");
      diagnostics.recommendations.push("System can work with simulated traffic");
    }

    // 3. TRACKING CHECK (Last 48 hours)
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
    
    const { data: recentConversions } = await supabase
      .from('conversion_events')
      .select('id, revenue')
      .eq('user_id', userId)
      .gte('tracked_at', cutoff);

    diagnostics.tracking = {
      clicksLast48h: recentClicks?.length || 0,
      viewsLast48h: recentViews?.length || 0,
      conversionsLast48h: recentConversions?.length || 0,
      revenueLast48h: recentConversions?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0
    };

    if (!recentClicks?.length && !recentViews?.length) {
      diagnostics.issues.push("⚠️ No tracking activity in last 48 hours");
      diagnostics.recommendations.push("Test tracking endpoints with /api/test-tracking-full");
    }

    // 4. AUTOMATION CHECK
    const { data: settings } = await supabase
      .from('user_settings')
      .select('autopilot_enabled, last_autopilot_run')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: postedContent } = await supabase
      .from('posted_content')
      .select('id, platform, clicks, revenue')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .order('created_at', { ascending: false })
      .limit(10);

    const timeSinceLastRun = settings?.last_autopilot_run 
      ? Math.floor((Date.now() - new Date(settings.last_autopilot_run).getTime()) / (1000 * 60))
      : null;

    diagnostics.automation = {
      autopilotEnabled: settings?.autopilot_enabled || false,
      lastAutopilotRun: settings?.last_autopilot_run || 'Never',
      minutesSinceLastRun: timeSinceLastRun,
      recentPosts: postedContent?.length || 0,
      totalClicks: postedContent?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0,
      totalRevenue: postedContent?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0
    };

    if (!settings?.autopilot_enabled) {
      diagnostics.issues.push("❌ Autopilot is disabled");
      diagnostics.recommendations.push("Enable autopilot in Dashboard");
    } else if (timeSinceLastRun && timeSinceLastRun > 60) {
      diagnostics.issues.push(`⚠️ Autopilot hasn't run in ${timeSinceLastRun} minutes (should run every 30min)`);
      diagnostics.recommendations.push("Test autopilot with /api/test-cron-autopilot");
    }

    // 5. CONTENT CHECK
    const { data: allPosts } = await supabase
      .from('posted_content')
      .select('platform, status')
      .eq('user_id', userId);

    const statusBreakdown = allPosts?.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    diagnostics.content = {
      totalPosts: allPosts?.length || 0,
      statusBreakdown,
      platforms: [...new Set(allPosts?.map(p => p.platform))]
    };

    // 6. HEALTH SUMMARY
    diagnostics.health = {
      score: 100,
      status: 'HEALTHY',
      criticalIssues: diagnostics.issues.filter((i: string) => i.startsWith('❌')).length,
      warnings: diagnostics.issues.filter((i: string) => i.startsWith('⚠️')).length
    };

    if (diagnostics.health.criticalIssues > 0) {
      diagnostics.health.status = 'CRITICAL';
      diagnostics.health.score = Math.max(0, 100 - (diagnostics.health.criticalIssues * 30));
    } else if (diagnostics.health.warnings > 0) {
      diagnostics.health.status = 'WARNING';
      diagnostics.health.score = Math.max(50, 100 - (diagnostics.health.warnings * 15));
    }

    return res.status(200).json({
      success: true,
      ...diagnostics,
      quickFixes: [
        "1. Visit /api/test-cron-autopilot to test autopilot",
        "2. Visit /api/test-cron-discovery to test product discovery",
        "3. Visit /api/test-tracking-full to test tracking system",
        "4. Visit /api/health-check for quick system overview"
      ]
    });

  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      diagnostics
    });
  }
}