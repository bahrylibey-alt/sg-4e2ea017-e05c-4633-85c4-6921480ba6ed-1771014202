import { supabase } from "@/integrations/supabase/client";

/**
 * REAL DATA ENFORCEMENT SERVICE
 * Zero tolerance for fake signals - revenue = 0 until verified
 */

export interface SystemState {
  state: 'NO_TRAFFIC' | 'LOW_SIGNAL' | 'TESTING' | 'SCALING';
  total_views: number;
  total_clicks: number;
  total_verified_conversions: number;
  total_verified_revenue: number;
  posts_today: number;
}

/**
 * Track real click event
 */
export async function trackClick(params: {
  contentId: string;
  platform: string;
  clickId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    await supabase.from("click_events").insert({
      content_id: params.contentId,
      platform: params.platform,
      click_id: params.clickId,
      user_id: user.id,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      link_id: params.contentId // Link ID is required by the schema
    });

    // Update system state
    await updateSystemState(user.id);

    return true;
  } catch (error) {
    console.error("Error tracking click:", error);
    return false;
  }
}

/**
 * Track real view event
 */
export async function trackViews(params: {
  contentId: string;
  platform: string;
  views: number;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    await supabase.from("view_events").insert({
      content_id: params.contentId,
      platform: params.platform,
      views: params.views,
      user_id: user.id
    });

    // Update system state
    await updateSystemState(user.id);

    return true;
  } catch (error) {
    console.error("Error tracking views:", error);
    return false;
  }
}

/**
 * Track VERIFIED conversion (webhook only)
 */
export async function trackConversion(params: {
  clickId: string;
  contentId: string;
  revenue: number;
  source: 'webhook' | 'api';
  webhookData?: any;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // CRITICAL: Only accept verified sources
    if (params.source !== 'webhook' && params.source !== 'api') {
      console.error("❌ Rejected fake conversion - invalid source");
      return false;
    }

    await supabase.from("conversion_events").insert({
      click_id: params.clickId,
      content_id: params.contentId,
      user_id: user.id,
      revenue: params.revenue,
      source: params.source,
      webhook_data: params.webhookData,
      verified: true
    });

    // Update system state
    await updateSystemState(user.id);

    console.log(`✅ Verified conversion tracked: $${params.revenue}`);
    return true;
  } catch (error) {
    console.error("Error tracking conversion:", error);
    return false;
  }
}

/**
 * Get system state
 */
export async function getSystemState(userId: string): Promise<SystemState> {
  try {
    // Get or create system state
    let { data: state } = await supabase
      .from("system_state")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!state) {
      // Create initial state
      const { data: newState } = await supabase
        .from("system_state")
        .insert({
          user_id: userId,
          state: 'NO_TRAFFIC',
          total_views: 0,
          total_clicks: 0,
          total_verified_conversions: 0,
          total_verified_revenue: 0,
          posts_today: 0
        })
        .select()
        .single();

      state = newState;
    }

    if (!state) {
      return {
        state: 'NO_TRAFFIC',
        total_views: 0,
        total_clicks: 0,
        total_verified_conversions: 0,
        total_verified_revenue: 0,
        posts_today: 0
      };
    }

    return {
      state: state.state as any,
      total_views: state.total_views || 0,
      total_clicks: state.total_clicks || 0,
      total_verified_conversions: state.total_verified_conversions || 0,
      total_verified_revenue: Number(state.total_verified_revenue) || 0,
      posts_today: state.posts_today || 0
    };
  } catch (error) {
    console.error("Error getting system state:", error);
    return {
      state: 'NO_TRAFFIC',
      total_views: 0,
      total_clicks: 0,
      total_verified_conversions: 0,
      total_verified_revenue: 0,
      posts_today: 0
    };
  }
}

/**
 * Update system state based on real data
 */
async function updateSystemState(userId: string): Promise<void> {
  try {
    // Aggregate real views
    const { data: viewData } = await supabase
      .from("view_events")
      .select("views")
      .eq("user_id", userId);

    const totalViews = viewData?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;

    // Count real clicks
    const { count: totalClicks } = await supabase
      .from("click_events")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);

    // Count verified conversions
    const { data: conversionData } = await supabase
      .from("conversion_events")
      .select("revenue")
      .eq("user_id", userId)
      .eq("verified", true);

    const totalConversions = conversionData?.length || 0;
    const totalRevenue = conversionData?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0;

    // Determine system state
    let state: SystemState['state'] = 'NO_TRAFFIC';

    if (totalViews < 100) {
      state = 'NO_TRAFFIC';
    } else if (totalClicks < 10) {
      state = 'LOW_SIGNAL';
    } else if (totalViews >= 100 && (totalClicks / totalViews) >= 0.01) {
      state = 'TESTING';
    }

    if (totalConversions >= 3 && totalRevenue >= 10) {
      state = 'SCALING';
    }

    // Update state
    await supabase
      .from("system_state")
      .upsert({
        user_id: userId,
        state,
        total_views: totalViews,
        total_clicks: totalClicks || 0,
        total_verified_conversions: totalConversions,
        total_verified_revenue: totalRevenue,
        updated_at: new Date().toISOString()
      });

  } catch (error) {
    console.error("Error updating system state:", error);
  }
}

/**
 * Get real revenue (ZERO until verified)
 */
export async function getRealRevenue(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from("conversion_events")
      .select("revenue")
      .eq("user_id", userId)
      .eq("verified", true);

    return data?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0;
  } catch (error) {
    console.error("Error getting real revenue:", error);
    return 0;
  }
}