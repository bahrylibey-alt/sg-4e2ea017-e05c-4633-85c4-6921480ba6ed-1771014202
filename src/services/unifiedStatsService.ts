import { supabase } from "@/integrations/supabase/client";

/**
 * UNIFIED STATS SERVICE
 * Real-time statistics from actual database data
 * NO SIMULATIONS - NO MOCKS
 */
export const unifiedStatsService = {
  /**
   * Get real system statistics for a user
   */
  async getRealStats(userId: string): Promise<{
    products: number;
    activeLinks: number;
    contentReady: number;
    clicks: number;
    conversions: number;
    revenue: number;
    postsToday: number;
    autopilotEnabled: boolean;
  }> {
    try {
      // Real products count
      const { count: productCount } = await (supabase as any)
        .from('product_catalog')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('network', ['amazon', 'aliexpress', 'clickbank', 'cj', 'shareasale']);

      // Real active affiliate links
      const { count: linkCount } = await (supabase as any)
        .from('affiliate_links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Content ready to post
      const { count: contentCount } = await (supabase as any)
        .from('generated_content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['ready', 'scheduled']);

      // Real clicks from actual visitors
      const { count: clickCount } = await (supabase as any)
        .from('click_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Real conversions
      const { data: conversions } = await (supabase as any)
        .from('conversion_events')
        .select('revenue')
        .eq('user_id', userId);

      const conversionCount = conversions?.length || 0;
      const totalRevenue = conversions?.reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0) || 0;

      // Posts today (only real published posts)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: postsToday } = await (supabase as any)
        .from('posted_content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'published')
        .gte('created_at', today.toISOString());

      // Autopilot status
      const { data: settings } = await (supabase as any)
        .from('user_settings')
        .select('autopilot_enabled')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        products: productCount || 0,
        activeLinks: linkCount || 0,
        contentReady: contentCount || 0,
        clicks: clickCount || 0,
        conversions: conversionCount,
        revenue: totalRevenue,
        postsToday: postsToday || 0,
        autopilotEnabled: settings?.autopilot_enabled || false
      };

    } catch (error) {
      console.error('Failed to get real stats:', error);
      return {
        products: 0,
        activeLinks: 0,
        contentReady: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        postsToday: 0,
        autopilotEnabled: false
      };
    }
  }
};

export interface UnifiedStats {
  totalProducts: number;
  activeLinks: number;
  contentGenerated: number;
  postsCreated: number;
  clicks: number;
  conversions: number;
  revenue: number;
  products?: number;
  contentReady?: number;
  postsToday?: number;
  autopilotEnabled?: boolean;
}

export class UnifiedStatsService {
  static async getStats(userId: string): Promise<UnifiedStats> {
    const stats = await unifiedStatsService.getRealStats(userId);
    return {
      totalProducts: stats.products,
      activeLinks: stats.activeLinks,
      contentGenerated: stats.contentReady,
      postsCreated: stats.postsToday,
      clicks: stats.clicks,
      conversions: stats.conversions,
      revenue: stats.revenue,
      ...stats
    };
  }
  
  async getStats(userId: string): Promise<UnifiedStats> {
    return UnifiedStatsService.getStats(userId);
  }
}