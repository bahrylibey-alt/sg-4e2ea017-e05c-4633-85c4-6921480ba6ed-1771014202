import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPLETE SYSTEM DIAGNOSTIC
 * 
 * Checks every component to identify why the system might be stuck
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. Check if user exists and has autopilot enabled
    const { data: users, error: usersError } = await supabase
      .from('user_settings')
      .select('user_id, autopilot_enabled, last_autopilot_run')
      .eq('autopilot_enabled', true);

    diagnostics.checks.autopilot_users = {
      status: usersError ? 'ERROR' : users && users.length > 0 ? 'PASS' : 'FAIL',
      count: users?.length || 0,
      error: usersError?.message,
      users: users?.map(u => ({
        userId: u.user_id,
        lastRun: u.last_autopilot_run
      }))
    };

    if (!users || users.length === 0) {
      diagnostics.rootCause = "NO_USERS_WITH_AUTOPILOT_ENABLED";
      diagnostics.fix = "Enable autopilot in user settings";
      return res.status(200).json(diagnostics);
    }

    const userId = users[0].user_id;

    // 2. Check cron execution history
    const { data: cronLogs } = await supabase
      .from('autopilot_cron_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    diagnostics.checks.cron_execution = {
      status: cronLogs && cronLogs.length > 0 ? 'PASS' : 'FAIL',
      lastExecution: cronLogs?.[0]?.execution_time,
      recentRuns: cronLogs?.length || 0,
      lastStatus: cronLogs?.[0]?.status,
      lastError: cronLogs?.[0]?.error
    };

    // 3. Check product catalog
    const { data: products } = await supabase
      .from('affiliate_links')
      .select('id, product_name, status, clicks, conversions, autopilot_state')
      .eq('user_id', userId)
      .eq('status', 'active');

    diagnostics.checks.products = {
      status: products && products.length > 0 ? 'PASS' : 'FAIL',
      total: products?.length || 0,
      active: products?.filter(p => p.autopilot_state !== 'killed').length || 0,
      testing: products?.filter(p => p.autopilot_state === 'testing').length || 0,
      scaling: products?.filter(p => p.autopilot_state === 'scaling').length || 0
    };

    // 4. Check content queue
    const { data: queue } = await supabase
      .from('content_queue')
      .select('id, platform, status, scheduled_for, error_message')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    diagnostics.checks.content_queue = {
      status: 'INFO',
      total: queue?.length || 0,
      pending: queue?.filter(q => q.status === 'pending').length || 0,
      failed: queue?.filter(q => q.status === 'failed').length || 0,
      recentErrors: queue?.filter(q => q.error_message).map(q => q.error_message).slice(0, 3)
    };

    // 5. Check recent posts
    const { data: recentPosts } = await supabase
      .from('posted_content')
      .select('platform, status, posted_at, impressions, clicks')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })
      .limit(5);

    diagnostics.checks.recent_activity = {
      status: recentPosts && recentPosts.length > 0 ? 'INFO' : 'WARN',
      lastPost: recentPosts?.[0]?.posted_at,
      postsLast24h: recentPosts?.filter(p => 
        new Date(p.posted_at || 0).getTime() > Date.now() - 24*60*60*1000
      ).length || 0,
      totalPosts: recentPosts?.length || 0
    };

    // 6. Check traffic generation
    const { data: clicksToday } = await supabase
      .from('click_events')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('clicked_at', new Date(Date.now() - 24*60*60*1000).toISOString());

    diagnostics.checks.traffic_today = {
      status: clicksToday && clicksToday.length > 0 ? 'PASS' : 'WARN',
      clicks24h: clicksToday?.length || 0
    };

    // 7. Check integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('provider, status, category')
      .eq('user_id', userId)
      .eq('status', 'connected');

    diagnostics.checks.integrations = {
      status: integrations && integrations.length > 0 ? 'PASS' : 'WARN',
      connected: integrations?.map(i => i.provider) || [],
      count: integrations?.length || 0
    };

    // 8. Check autopilot settings
    const { data: settings } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    diagnostics.checks.autopilot_settings = {
      status: settings ? 'PASS' : 'WARN',
      exists: !!settings,
      autoScale: settings?.auto_scale_winners,
      pauseUnderperformers: settings?.pause_underperformers,
      platforms: settings?.enabled_platforms
    };

    // DETERMINE ROOT CAUSE
    if (diagnostics.checks.products.status === 'FAIL') {
      diagnostics.rootCause = "NO_ACTIVE_PRODUCTS";
      diagnostics.fix = "Add products to your catalog or run product discovery";
    } else if (diagnostics.checks.cron_execution.status === 'FAIL') {
      diagnostics.rootCause = "CRON_NOT_RUNNING";
      diagnostics.fix = "Cron jobs may not be configured in Vercel. Check vercel.json";
    } else if (diagnostics.checks.recent_activity.postsLast24h === 0) {
      diagnostics.rootCause = "NO_RECENT_POSTS";
      diagnostics.fix = "Content generation or posting may be failing. Check queue for errors";
    } else if (diagnostics.checks.traffic_today.status === 'WARN') {
      diagnostics.rootCause = "NO_NEW_TRAFFIC";
      diagnostics.fix = "Traffic generation needs to be restarted";
    } else {
      diagnostics.rootCause = "SYSTEM_HEALTHY_BUT_SLOW";
      diagnostics.fix = "System is running but may need optimization or more products";
    }

    return res.status(200).json(diagnostics);

  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}