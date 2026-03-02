import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];
type ClickEvent = Database["public"]["Tables"]["click_events"]["Row"];
type Commission = Database["public"]["Tables"]["commissions"]["Row"];

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

export interface TrafficSourcePerformance {
  name: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export interface PerformanceSnapshot {
  timestamp: string;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommissions: number;
  conversionRate: number;
  averageCommissionPerSale: number;
  activeLinks: number;
  activeCampaigns: number;
  recentActivity: ActivityEvent[];
  topProducts: ProductPerformance[];
  topTrafficSources: TrafficSourcePerformance[];
}

export interface ActivityEvent {
  id: string;
  type: "click" | "conversion" | "commission" | "link_created";
  timestamp: string;
  description: string;
  amount?: number;
  linkName?: string;
}

export interface TrafficInsight {
  source: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export const realTimeAnalytics = {
  // Get current performance snapshot
  async getPerformanceSnapshot(): Promise<PerformanceSnapshot> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return this.getEmptySnapshot();
      }

      // Get all active campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id);

      // Get all affiliate links
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id);

      // Get all commissions
      const { data: commissions } = await supabase
        .from("commissions")
        .select("*")
        .eq("user_id", user.id);

      // Get recent click events (last 100)
      const { data: recentClicks } = await supabase
        .from("click_events")
        .select("*")
        .eq("user_id", user.id)
        .order("clicked_at", { ascending: false })
        .limit(100);

      // Calculate totals
      const totalClicks = links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
      const totalConversions = links?.reduce((sum, link) => sum + (link.conversion_count || 0), 0) || 0;
      const totalRevenue = campaigns?.reduce((sum, c) => sum + Number(c.revenue || 0), 0) || 0;
      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const averageCommissionPerSale = totalConversions > 0 ? totalCommissions / totalConversions : 0;

      // Build recent activity
      const recentActivity = this.buildActivityFeed(links, commissions, recentClicks);

      // Get top products
      const topProducts = await this.getProductPerformance();

      // Get top traffic sources
      const trafficInsights = await this.getTrafficInsights();
      const topTrafficSources: TrafficSourcePerformance[] = trafficInsights.slice(0, 5).map(t => ({
        name: t.source,
        clicks: t.clicks,
        conversions: t.conversions,
        revenue: t.revenue,
        conversionRate: t.conversionRate
      }));

      return {
        timestamp: new Date().toISOString(),
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCommissions,
        conversionRate,
        averageCommissionPerSale,
        activeLinks: links?.filter(l => l.status === "active").length || 0,
        activeCampaigns: campaigns?.filter(c => c.status === "active").length || 0,
        recentActivity: recentActivity.slice(0, 10),
        topProducts: topProducts.slice(0, 5),
        topTrafficSources
      };
    } catch (error) {
      console.error("❌ Error getting performance snapshot:", error);
      return this.getEmptySnapshot();
    }
  },

  // Get product performance data
  async getProductPerformance(): Promise<ProductPerformance[]> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return [];

      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .order("commission_earned", { ascending: false });

      if (!links || links.length === 0) return [];

      return links.map(link => {
        const clicks = link.clicks || 0;
        const conversions = link.conversion_count || 0;
        const revenue = link.commission_earned || 0;
        const commission = revenue;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
        const roi = revenue > 0 ? (revenue / Math.max(clicks * 0.1, 1)) * 100 : 0;

        return {
          productId: link.id,
          productName: link.product_name || "Unknown Product",
          clicks,
          conversions,
          revenue,
          commission,
          conversionRate,
          roi
        };
      });
    } catch (error) {
      console.error("❌ Error getting product performance:", error);
      return [];
    }
  },

  // Subscribe to real-time updates
  subscribeToUpdates(
    userId: string,
    onUpdate: (snapshot: PerformanceSnapshot) => void
  ): () => void {
    // Set up real-time subscription for click events
    const clicksChannel = supabase
      .channel("click_events_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "click_events",
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const snapshot = await this.getPerformanceSnapshot();
          onUpdate(snapshot);
        }
      )
      .subscribe();

    // Set up real-time subscription for commissions
    const commissionsChannel = supabase
      .channel("commissions_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commissions",
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const snapshot = await this.getPerformanceSnapshot();
          onUpdate(snapshot);
        }
      )
      .subscribe();

    // Set up real-time subscription for affiliate links
    const linksChannel = supabase
      .channel("affiliate_links_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "affiliate_links",
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const snapshot = await this.getPerformanceSnapshot();
          onUpdate(snapshot);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      clicksChannel.unsubscribe();
      commissionsChannel.unsubscribe();
      linksChannel.unsubscribe();
    };
  },

  // Get traffic insights by source
  async getTrafficInsights(): Promise<TrafficInsight[]> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return [];

      const { data: clicks } = await supabase
        .from("click_events")
        .select("*")
        .eq("user_id", user.id);

      if (!clicks || clicks.length === 0) return [];

      // Group by referrer
      const sourceMap = new Map<string, {
        clicks: number;
        conversions: number;
        revenue: number;
      }>();

      for (const click of clicks) {
        const source = click.referrer || "direct";
        const existing = sourceMap.get(source) || { clicks: 0, conversions: 0, revenue: 0 };
        
        sourceMap.set(source, {
          clicks: existing.clicks + 1,
          conversions: existing.conversions + (click.converted ? 1 : 0),
          revenue: existing.revenue + (click.converted ? 50 : 0)
        });
      }

      // Convert to array and calculate rates
      return Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        clicks: data.clicks,
        conversions: data.conversions,
        revenue: data.revenue,
        conversionRate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
      })).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error("❌ Error getting traffic insights:", error);
      return [];
    }
  },

  // Build activity feed from various sources
  buildActivityFeed(
    links?: AffiliateLink[] | null,
    commissions?: Commission[] | null,
    clicks?: ClickEvent[] | null
  ): ActivityEvent[] {
    const activities: ActivityEvent[] = [];

    // Add recent link creations
    if (links) {
      links.slice(0, 5).forEach(link => {
        activities.push({
          id: `link-${link.id}`,
          type: "link_created",
          timestamp: link.created_at,
          description: `Created affiliate link for ${link.product_name || "product"}`,
          linkName: link.product_name || undefined
        });
      });
    }

    // Add recent clicks
    if (clicks) {
      clicks.slice(0, 20).forEach(click => {
        activities.push({
          id: `click-${click.id}`,
          type: "click",
          timestamp: click.clicked_at,
          description: `Click from ${click.referrer || "direct"} on ${click.device_type || "unknown"} device`
        });
      });
    }

    // Add recent conversions (from clicks that converted)
    if (clicks) {
      clicks.filter(c => c.converted).slice(0, 10).forEach(click => {
        activities.push({
          id: `conversion-${click.id}`,
          type: "conversion",
          timestamp: click.clicked_at,
          description: `Conversion from ${click.referrer || "direct"}`,
          amount: 50
        });
      });
    }

    // Add recent commissions - FIXED: use created_at instead of transaction_date
    if (commissions) {
      commissions.slice(0, 10).forEach(comm => {
        activities.push({
          id: `commission-${comm.id}`,
          type: "commission",
          timestamp: comm.created_at,
          description: `Commission earned`,
          amount: Number(comm.amount || 0)
        });
      });
    }

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  // Get empty snapshot
  getEmptySnapshot(): PerformanceSnapshot {
    return {
      timestamp: new Date().toISOString(),
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      totalCommissions: 0,
      conversionRate: 0,
      averageCommissionPerSale: 0,
      activeLinks: 0,
      activeCampaigns: 0,
      recentActivity: [],
      topProducts: [],
      topTrafficSources: []
    };
  }
};