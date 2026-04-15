import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPREHENSIVE SYSTEM DIAGNOSTIC
 * Tests ALL components and identifies issues
 * Visit: /api/diagnose-system
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    tracking: {},
    automation: {},
    issues: [],
    recommendations: []
  };

  try {
    // 1. ENVIRONMENT CHECK
    diagnostics.environment = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      cronSecret: !!process.env.CRON_SECRET,
      cronSecretValue: process.env.CRON_SECRET?.substring(0, 10) + '...'
    };

    if (!process.env.CRON_SECRET) {
      diagnostics.issues.push("❌ CRON_SECRET missing - cron jobs will fail authentication");
      diagnostics.recommendations.push("Add CRON_SECRET to .env.local");
    }

    // 2. DATABASE CHECK
    const { data: profiles } = await supabase.from('profiles').select('id, email');
    const { data: products } = await supabase.from('product_catalog').select('id, status');
    const { data: integrations } = await supabase.from('integrations').select('provider, status');
    const { data: systemState } = await supabase.from('system_state').select('*');

    diagnostics.database = {
      totalUsers: profiles?.length || 0,
      totalProducts: products?.length || 0,
      activeProducts: products?.filter(p => p.status === 'active').length || 0,
      integrations: integrations?.map(i => `${i.provider}:${i.status}`) || [],
      systemState: systemState?.[0] || null
    };

    if (!profiles?.length) {
      diagnostics.issues.push("❌ No users found - system has no users");
    }
    if (!products?.length) {
      diagnostics.issues.push("⚠️ No products in catalog");
      diagnostics.recommendations.push("Run product discovery or add products manually");
    }

    // 3. TRACKING CHECK (Last 48 hours)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: recentClicks } = await supabase
      .from('click_events')
      .select('id')
      .gte('tracked_at', cutoff);
    
    const { data: recentViews } = await supabase
      .from('view_events')
      .select('id')
      .gte('tracked_at', cutoff);
    
    const { data: recentConversions } = await supabase
      .from('conversion_events')
      .select('id, revenue')
      .gte('tracked_at', cutoff);

    diagnostics.tracking = {
      clicksLast48h: recentClicks?.length || 0,
      viewsLast48h: recentViews?.length || 0,
      conversionsLast48h: recentConversions?.length || 0,
      revenueLast48h: recentConversions?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0
    };

    if (!recentClicks?.length && !recentViews?.length) {
      diagnostics.issues.push("❌ No tracking activity in last 48 hours");
      diagnostics.recommendations.push("Test tracking endpoints manually");
    }

    // 4. AUTOMATION CHECK
    const { data: autopilotScores } = await supabase
      .from('autopilot_scores')
      .select('updated_at, total_score')
      .order('updated_at', { ascending: false })
      .limit(1);

    const { data: scheduledPosts } = await supabase
      .from('scheduled_content')
      .select('id, status, scheduled_for')
      .in('status', ['pending', 'processing']);

    const lastAutopilotRun = autopilotScores?.[0]?.updated_at;
    const timeSinceLastRun = lastAutopilotRun 
      ? Math.floor((Date.now() - new Date(lastAutopilotRun).getTime()) / (1000 * 60))
      : null;

    diagnostics.automation = {
      lastAutopilotRun: lastAutopilotRun || 'Never',
      minutesSinceLastRun: timeSinceLastRun,
      autopilotScore: autopilotScores?.[0]?.total_score || 0,
      scheduledPosts: scheduledPosts?.length || 0
    };

    if (timeSinceLastRun && timeSinceLastRun > 60) {
      diagnostics.issues.push(`⚠️ Autopilot hasn't run in ${timeSinceLastRun} minutes (should run every 30min)`);
      diagnostics.recommendations.push("Check Vercel cron configuration or run /api/test-cron-autopilot");
    }

    // 5. INTEGRATION CHECK
    const { data: activeIntegrations } = await supabase
      .from('integrations')
      .select('provider, last_sync_at, status')
      .eq('status', 'connected');

    diagnostics.integrations = activeIntegrations?.map(i => ({
      provider: i.provider,
      lastSync: i.last_sync_at,
      hoursSinceSync: i.last_sync_at 
        ? Math.floor((Date.now() - new Date(i.last_sync_at).getTime()) / (1000 * 60 * 60))
        : null
    })) || [];

    activeIntegrations?.forEach(i => {
      if (!i.last_sync_at) {
        diagnostics.issues.push(`⚠️ ${i.provider} integration never synced`);
      }
    });

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
        "4. Check Vercel dashboard for cron execution logs"
      ]
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      diagnostics
    });
  }
}