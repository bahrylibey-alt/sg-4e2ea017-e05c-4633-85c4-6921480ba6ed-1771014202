import { supabase } from "@/integrations/supabase/client";

/**
 * UNIFIED TRACKING SERVICE
 * 
 * Single source of truth for all tracking
 * Writes to ALL necessary tables to keep everything in sync
 */

export const unifiedTrackingService = {
  /**
   * Track a view on posted content
   * Updates: posted_content.impressions → system_state.total_views (auto via trigger)
   */
  async trackContentView(contentId: string, viewCount: number = 1): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log(`📊 Tracking ${viewCount} view(s) on content ${contentId}`);

      // Get current impressions
      const { data: content } = await supabase
        .from('posted_content')
        .select('impressions, user_id')
        .eq('id', contentId)
        .single();

      if (!content) {
        console.error('❌ Content not found:', contentId);
        return false;
      }

      // Update impressions (trigger will auto-update system_state)
      const newImpressions = (content.impressions || 0) + viewCount;
      
      const { error } = await supabase
        .from('posted_content')
        .update({ 
          impressions: newImpressions,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) {
        console.error('❌ Failed to update impressions:', error);
        return false;
      }

      console.log(`✅ View tracked: ${contentId} now has ${newImpressions} impressions`);
      return true;
    } catch (error) {
      console.error('❌ View tracking error:', error);
      return false;
    }
  },

  /**
   * Track a click on posted content
   * Updates: posted_content.clicks → system_state.total_clicks (auto via trigger)
   */
  async trackContentClick(contentId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log(`👆 Tracking click on content ${contentId}`);

      // Get current clicks
      const { data: content } = await supabase
        .from('posted_content')
        .select('clicks, link_id')
        .eq('id', contentId)
        .single();

      if (!content) {
        console.error('❌ Content not found:', contentId);
        return false;
      }

      // Update clicks (trigger will auto-update system_state)
      const newClicks = (content.clicks || 0) + 1;
      
      const { error } = await supabase
        .from('posted_content')
        .update({ 
          clicks: newClicks,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) {
        console.error('❌ Failed to update clicks:', error);
        return false;
      }

      // Also update affiliate_links if linked
      if (content.link_id) {
        const { data: linkData } = await supabase
          .from('affiliate_links')
          .select('clicks')
          .eq('id', content.link_id)
          .single();
          
        if (linkData) {
          await supabase
            .from('affiliate_links')
            .update({ clicks: (linkData.clicks || 0) + 1 })
            .eq('id', content.link_id);
        }
      }

      console.log(`✅ Click tracked: ${contentId} now has ${newClicks} clicks`);
      return true;
    } catch (error) {
      console.error('❌ Click tracking error:', error);
      return false;
    }
  },

  /**
   * Track a conversion on posted content
   * Updates: posted_content.conversions + revenue → system_state (auto via trigger)
   */
  async trackContentConversion(contentId: string, revenue: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log(`💰 Tracking conversion on content ${contentId}: $${revenue}`);

      // Get current stats
      const { data: content } = await supabase
        .from('posted_content')
        .select('conversions, revenue')
        .eq('id', contentId)
        .single();

      if (!content) {
        console.error('❌ Content not found:', contentId);
        return false;
      }

      // Update conversions and revenue (trigger will auto-update system_state)
      const newConversions = (content.conversions || 0) + 1;
      const newRevenue = (Number(content.revenue) || 0) + revenue;
      
      const { error } = await supabase
        .from('posted_content')
        .update({ 
          conversions: newConversions,
          revenue: newRevenue,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) {
        console.error('❌ Failed to update conversion:', error);
        return false;
      }

      console.log(`✅ Conversion tracked: ${contentId} now has ${newConversions} conversions, $${newRevenue} revenue`);
      return true;
    } catch (error) {
      console.error('❌ Conversion tracking error:', error);
      return false;
    }
  },

  /**
   * Get real-time stats from system_state
   * This now stays in sync automatically via database triggers
   */
  async getRealtimeStats(userId: string) {
    try {
      const { data: state, error } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !state) {
        console.log('⚠️ No system state found, returning zeros');
        return {
          total_views: 0,
          total_clicks: 0,
          total_conversions: 0,
          total_revenue: 0,
          state: 'NO_TRAFFIC'
        };
      }

      return {
        total_views: state.total_views || 0,
        total_clicks: state.total_clicks || 0,
        total_conversions: state.total_verified_conversions || 0,
        total_revenue: Number(state.total_verified_revenue) || 0,
        state: state.state
      };
    } catch (error) {
      console.error('❌ Error getting realtime stats:', error);
      return {
        total_views: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_revenue: 0,
        state: 'NO_TRAFFIC'
      };
    }
  },

  /**
   * Manual sync if needed (fallback)
   * Normally triggers handle this automatically
   */
  async manualSync(userId: string): Promise<boolean> {
    try {
      console.log('🔄 Running manual sync for user:', userId);

      // Get totals from posted_content
      const { data: posts } = await supabase
        .from('posted_content')
        .select('impressions, clicks, conversions, revenue')
        .eq('user_id', userId)
        .eq('status', 'posted');

      const totalViews = posts?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0;
      const totalClicks = posts?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;
      const totalConversions = posts?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0;
      const totalRevenue = posts?.reduce((sum, p) => sum + (Number(p.revenue) || 0), 0) || 0;

      // Update system_state
      const { error } = await supabase
        .from('system_state')
        .upsert({
          user_id: userId,
          total_views: totalViews,
          total_clicks: totalClicks,
          total_verified_conversions: totalConversions,
          total_verified_revenue: totalRevenue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('❌ Manual sync failed:', error);
        return false;
      }

      console.log(`✅ Manual sync complete: ${totalViews} views, ${totalClicks} clicks, ${totalConversions} conversions, $${totalRevenue}`);
      return true;
    } catch (error) {
      console.error('❌ Manual sync error:', error);
      return false;
    }
  }
};