import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export interface AnalyticsSnapshot {
  timestamp: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  topProducts: Array<{
    name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  topTrafficSources: Array<{
    name: string;
    clicks: number;
    conversions: number;
  }>;
  conversionRate: number;
  averageOrderValue: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  conversionRate: number;
  roi: number;
}

export const realTimeAnalytics = {
  // Get real-time performance snapshot
  async getPerformanceSnapshot(): Promise<AnalyticsSnapshot> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    // Fetch all user data
    const [campaignsRes, linksRes, commissionsRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("user_id", user.id),
      supabase.from("affiliate_links").select("*").eq("user_id", user.id),
      supabase.from("commissions").select("*").eq("user_id", user.id)
    ]);

    const campaigns = campaignsRes.data || [];
    const links = linksRes.data || [];
    const commissions = commissionsRes.data || [];

    // Calculate aggregate metrics
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const totalConversions = links.reduce((sum, link) => sum + (link.conversions || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + Number(c.revenue || 0), 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // Top performing products
    const topProducts = links
      .sort((a, b) => (b.conversions || 0) - (a.conversions || 0))
      .slice(0, 5)
      .map(link => ({
        name: link.product_name || "Unknown Product",
        clicks: link.clicks || 0,
        conversions: link.conversions || 0,
        revenue: Number(link.revenue || 0)
      }));

    // Top traffic sources
    const trafficSourcesRes = await supabase
      .from("traffic_sources")
      .select("*")
      .in("campaign_id", campaigns.map(c => c.id));

    const trafficSources = trafficSourcesRes.data || [];
    const topTrafficSources = trafficSources
      .sort((a, b) => (b.total_clicks || 0) - (a.total_clicks || 0))
      .slice(0, 5)
      .map(source => ({
        name: source.source_name || "Unknown Source",
        clicks: source.total_clicks || 0,
        conversions: source.total_conversions || 0
      }));

    return {
      timestamp: new Date().toISOString(),
      clicks: totalClicks,
      conversions: totalConversions,
      revenue: totalRevenue,
      commissions: totalCommissions,
      topProducts,
      topTrafficSources,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      averageOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0
    };
  },

  // Track click event
  async trackClick(linkId: string, sourceType?: string) {
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("clicks")
      .eq("id", linkId)
      .single();

    if (link) {
      await supabase
        .from("affiliate_links")
        .update({
          clicks: (link.clicks || 0) + 1,
          last_clicked_at: new Date().toISOString()
        })
        .eq("id", linkId);

      // Create click event
      await supabase.from("click_events").insert({
        link_id: linkId,
        source_type: sourceType || "direct",
        clicked_at: new Date().toISOString()
      });
    }
  },

  // Track conversion event
  async trackConversion(linkId: string, amount: number, commissionAmount: number) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    // Update link statistics
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("conversions, revenue")
      .eq("id", linkId)
      .single();

    if (link) {
      await supabase
        .from("affiliate_links")
        .update({
          conversions: (link.conversions || 0) + 1,
          revenue: Number(link.revenue || 0) + amount
        })
        .eq("id", linkId);

      // Create commission record
      await supabase.from("commissions").insert({
        user_id: user.id,
        link_id: linkId,
        amount: commissionAmount,
        sale_amount: amount,
        status: "pending",
        created_at: new Date().toISOString()
      });
    }
  },

  // Get detailed product performance
  async getProductPerformance(): Promise<ProductPerformance[]> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    const { data: links } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("user_id", user.id);

    if (!links) return [];

    return links.map(link => {
      const clicks = link.clicks || 0;
      const conversions = link.conversions || 0;
      const revenue = Number(link.revenue || 0);
      const commission = revenue * 0.1; // Assume 10% commission average

      return {
        productId: link.id,
        productName: link.product_name || "Unknown Product",
        clicks,
        conversions,
        revenue,
        commission,
        conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
        roi: revenue > 0 ? (commission / revenue) * 100 : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);
  },

  // Get hourly performance data (for charts)
  async getHourlyPerformance(hours: number = 24) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    // This would typically fetch time-series data from click_events table
    // For now, return sample structure
    const hourlyData = [];
    const now = new Date();

    for (let i = hours - 1; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      hourlyData.push({
        timestamp: hour.toISOString(),
        clicks: 0,
        conversions: 0,
        revenue: 0
      });
    }

    return hourlyData;
  }
};