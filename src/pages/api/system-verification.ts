import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Check Products
    const { data: products, error: productsError } = await supabase
      .from('product_catalog')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const { count: totalProducts } = await supabase
      .from('product_catalog')
      .select('*', { count: 'exact', head: true });

    // 2. Check Affiliate Links
    const { data: links, error: linksError } = await supabase
      .from('affiliate_links')
      .select('id, short_code, clicks, conversions, revenue')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { count: totalLinks } = await supabase
      .from('affiliate_links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 3. Check Posted Content
    const { data: posts, error: postsError } = await supabase
      .from('posted_content')
      .select('platform, status, impressions, clicks, conversions, revenue')
      .eq('user_id', user.id)
      .order('posted_at', { ascending: false })
      .limit(5);

    const { count: totalPosts } = await supabase
      .from('posted_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 4. Check Click Events
    const { data: clicks, error: clicksError } = await supabase
      .from('click_events')
      .select('id, clicked_at, converted, country, device_type')
      .eq('user_id', user.id)
      .order('clicked_at', { ascending: false })
      .limit(10);

    const { count: totalClicks } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: convertedClicks } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('converted', true);

    // 5. Check View Events
    const { data: views, error: viewsError } = await supabase
      .from('view_events')
      .select('platform, views, tracked_at')
      .eq('user_id', user.id)
      .order('tracked_at', { ascending: false })
      .limit(5);

    const { data: viewStats } = await supabase
      .from('view_events')
      .select('views')
      .eq('user_id', user.id);

    const totalViews = viewStats?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;

    // 6. Check Conversion Events
    const { data: conversions, error: conversionsError } = await supabase
      .from('conversion_events')
      .select('revenue, source, verified, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { count: totalConversions } = await supabase
      .from('conversion_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: conversionStats } = await supabase
      .from('conversion_events')
      .select('revenue')
      .eq('user_id', user.id);

    const totalRevenue = conversionStats?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0;

    // 7. Check Autopilot Status
    const { data: settings } = await supabase
      .from('user_settings')
      .select('autopilot_enabled, last_autopilot_run')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: tasks } = await supabase
      .from('autopilot_tasks')
      .select('task_type, status, next_run_at')
      .eq('user_id', user.id)
      .order('next_run_at', { ascending: true })
      .limit(5);

    // Calculate metrics
    const conversionRate = totalClicks && totalConversions 
      ? ((totalConversions / totalClicks) * 100).toFixed(2)
      : '0.00';

    const avgRevenue = totalConversions 
      ? (totalRevenue / totalConversions).toFixed(2)
      : '0.00';

    // Build comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      status: 'OPERATIONAL',
      
      summary: {
        products: totalProducts || 0,
        affiliateLinks: totalLinks || 0,
        posts: totalPosts || 0,
        clicks: totalClicks || 0,
        conversions: totalConversions || 0,
        views: totalViews,
        revenue: totalRevenue.toFixed(2),
        conversionRate: `${conversionRate}%`,
        avgRevenuePerConversion: `$${avgRevenue}`
      },

      recentActivity: {
        latestProducts: products?.map(p => ({
          name: p.name,
          addedAt: new Date(p.created_at).toLocaleString()
        })) || [],
        
        topLinks: links?.map(l => ({
          code: l.short_code,
          clicks: l.clicks || 0,
          conversions: l.conversions || 0,
          revenue: Number(l.revenue || 0).toFixed(2)
        })) || [],

        recentPosts: posts?.map(p => ({
          platform: p.platform,
          status: p.status,
          impressions: p.impressions || 0,
          clicks: p.clicks || 0,
          conversions: p.conversions || 0,
          revenue: Number(p.revenue || 0).toFixed(2)
        })) || [],

        recentClicks: clicks?.map(c => ({
          time: new Date(c.clicked_at).toLocaleString(),
          converted: c.converted,
          country: c.country,
          device: c.device_type
        })) || [],

        recentConversions: conversions?.map(c => ({
          revenue: Number(c.revenue).toFixed(2),
          source: c.source,
          verified: c.verified,
          time: new Date(c.created_at).toLocaleString()
        })) || []
      },

      autopilot: {
        enabled: settings?.autopilot_enabled || false,
        lastRun: settings?.last_autopilot_run || 'Never',
        upcomingTasks: tasks?.map(t => ({
          type: t.task_type,
          status: t.status,
          nextRun: t.next_run_at ? new Date(t.next_run_at).toLocaleString() : 'Not scheduled'
        })) || []
      },

      systemHealth: {
        productDiscovery: totalProducts && totalProducts > 19 ? '✅ WORKING' : '⚠️ NEEDS ATTENTION',
        trackingSystem: totalClicks && totalClicks > 0 ? '✅ WORKING' : '⚠️ NO DATA',
        conversionTracking: totalConversions && totalConversions > 0 ? '✅ WORKING' : '⚠️ NO DATA',
        autopilotEngine: settings?.autopilot_enabled ? '✅ ENABLED' : '❌ DISABLED',
        contentPosting: totalPosts && totalPosts > 0 ? '✅ WORKING' : '⚠️ NO POSTS'
      }
    };

    return res.status(200).json(report);

  } catch (error: any) {
    console.error('System verification error:', error);
    return res.status(500).json({ 
      error: 'System verification failed',
      details: error.message 
    });
  }
}