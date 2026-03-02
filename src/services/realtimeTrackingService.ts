import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import type { Database } from "@/integrations/supabase/types";

type ClickEvent = Database["public"]["Tables"]["click_events"]["Row"];
type Commission = Database["public"]["Tables"]["commissions"]["Row"];

export interface LiveActivity {
  id: string;
  type: "click" | "conversion" | "commission";
  timestamp: string;
  product: string;
  amount?: number;
  source?: string;
  country?: string;
}

export interface RealtimeStats {
  activeLinks: number;
  todayClicks: number;
  todayConversions: number;
  todayRevenue: number;
  liveVisitors: number;
  topPerformers: Array<{ product: string; clicks: number; revenue: number }>;
}

export const realtimeTrackingService = {
  // Subscribe to real-time click events
  subscribeToClickEvents(
    userId: string,
    onEvent: (event: LiveActivity) => void
  ) {
    const channel = supabase
      .channel(`clicks:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "click_events"
        },
        async (payload) => {
          const clickEvent = payload.new as ClickEvent;
          
          // Get link details
          const { data: link } = await supabase
            .from("affiliate_links")
            .select("product_name")
            .eq("id", clickEvent.link_id)
            .single();

          onEvent({
            id: clickEvent.id,
            type: "click",
            timestamp: clickEvent.clicked_at,
            product: link?.product_name || "Unknown Product",
            source: clickEvent.referrer || "Direct",
            country: clickEvent.country || undefined
          });
        }
      )
      .subscribe();

    return channel;
  },

  // Subscribe to real-time commission events
  subscribeToCommissionEvents(
    userId: string,
    onEvent: (event: LiveActivity) => void
  ) {
    const channel = supabase
      .channel(`commissions:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commissions",
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const commission = payload.new as Commission;
          
          // Get link details
          const { data: link } = await supabase
            .from("affiliate_links")
            .select("product_name")
            .eq("id", commission.link_id || "")
            .single();

          onEvent({
            id: commission.id,
            type: commission.status === "paid" ? "commission" : "conversion",
            timestamp: commission.created_at,
            product: link?.product_name || "Unknown Product",
            amount: Number(commission.amount) || 0
          });
        }
      )
      .subscribe();

    return channel;
  },

  // Get real-time statistics
  async getRealtimeStats(): Promise<RealtimeStats> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          activeLinks: 0,
          todayClicks: 0,
          todayConversions: 0,
          todayRevenue: 0,
          liveVisitors: 0,
          topPerformers: []
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // Get active links count
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id, product_name, clicks, commission_earned")
        .eq("user_id", user.id)
        .eq("status", "active");

      const activeLinks = links?.length || 0;

      // Get today's clicks
      const { data: todayClicks } = await supabase
        .from("click_events")
        .select("id, link_id")
        .gte("clicked_at", todayStr);

      const todayClicksCount = todayClicks?.length || 0;

      // Get today's conversions
      const convertedClicks = todayClicks?.filter(c => c.link_id) || [];
      const { data: todayCommissions } = await supabase
        .from("commissions")
        .select("amount, link_id")
        .eq("user_id", user.id)
        .gte("created_at", todayStr);

      const todayConversions = todayCommissions?.length || 0;
      const todayRevenue = todayCommissions?.reduce(
        (sum, c) => sum + Number(c.amount || 0),
        0
      ) || 0;

      // Get live visitors (clicks in last 5 minutes)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentClicks } = await supabase
        .from("click_events")
        .select("id")
        .gte("clicked_at", fiveMinAgo);

      const liveVisitors = recentClicks?.length || 0;

      // Get top performers
      const topPerformers = (links || [])
        .sort((a, b) => (b.commission_earned || 0) - (a.commission_earned || 0))
        .slice(0, 5)
        .map(link => ({
          product: link.product_name || "Unknown",
          clicks: link.clicks || 0,
          revenue: link.commission_earned || 0
        }));

      return {
        activeLinks,
        todayClicks: todayClicksCount,
        todayConversions,
        todayRevenue,
        liveVisitors,
        topPerformers
      };
    } catch (error) {
      console.error("Error fetching realtime stats:", error);
      return {
        activeLinks: 0,
        todayClicks: 0,
        todayConversions: 0,
        todayRevenue: 0,
        liveVisitors: 0,
        topPerformers: []
      };
    }
  },

  // Get recent activity feed
  async getRecentActivity(limit: number = 20): Promise<LiveActivity[]> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return [];

      // Get recent clicks
      const { data: clicks } = await supabase
        .from("click_events")
        .select("*, affiliate_links!inner(product_name, user_id)")
        .eq("affiliate_links.user_id", user.id)
        .order("clicked_at", { ascending: false })
        .limit(limit);

      // Get recent commissions
      const { data: commissions } = await supabase
        .from("commissions")
        .select("*, affiliate_links(product_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      const activities: LiveActivity[] = [];

      // Add clicks
      clicks?.forEach(click => {
        activities.push({
          id: click.id,
          type: "click",
          timestamp: click.clicked_at,
          product: click.affiliate_links?.product_name || "Unknown",
          source: click.referrer || "Direct",
          country: click.country || undefined
        });
      });

      // Add commissions
      commissions?.forEach(comm => {
        activities.push({
          id: comm.id,
          type: comm.status === "paid" ? "commission" : "conversion",
          timestamp: comm.created_at,
          product: comm.affiliate_links?.product_name || "Unknown",
          amount: Number(comm.amount) || 0
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching activity:", error);
      return [];
    }
  },

  // Simulate live activity for testing (remove in production)
  async generateTestActivity(userId: string): Promise<void> {
    try {
      // Get user's active links
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id, product_name")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(5);

      if (!links || links.length === 0) return;

      // Generate random click
      const randomLink = links[Math.floor(Math.random() * links.length)];
      
      await supabase.from("click_events").insert({
        link_id: randomLink.id,
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: "Mozilla/5.0 (Test)",
        country: ["US", "UK", "CA", "AU", "DE"][Math.floor(Math.random() * 5)],
        device_type: ["desktop", "mobile", "tablet"][Math.floor(Math.random() * 3)],
        referrer: "https://test.com"
      });

      // Randomly generate conversion
      if (Math.random() > 0.7) {
        const commissionAmount = Math.floor(Math.random() * 50) + 10;
        
        await supabase.from("commissions").insert({
          user_id: userId,
          link_id: randomLink.id,
          amount: commissionAmount,
          currency: "USD",
          status: "pending"
        });
      }
    } catch (error) {
      console.error("Error generating test activity:", error);
    }
  },

  // Track click with enhanced data
  async trackEnhancedClick(
    linkId: string,
    metadata: {
      ip_address?: string;
      user_agent?: string;
      referrer?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    }
  ): Promise<{ success: boolean; clickId: string | null }> {
    try {
      const { data: click, error } = await supabase
        .from("click_events")
        .insert({
          link_id: linkId,
          ip_address: metadata.ip_address || null,
          user_agent: metadata.user_agent || null,
          referrer: metadata.referrer || null,
          country: null, // Would be determined by IP geolocation service
          device_type: this.detectDeviceType(metadata.user_agent)
        })
        .select()
        .single();

      if (error || !click) {
        return { success: false, clickId: null };
      }

      // Update link click count
      await supabase.rpc("increment_link_clicks", { link_id: linkId });

      return { success: true, clickId: click.id };
    } catch (error) {
      console.error("Error tracking click:", error);
      return { success: false, clickId: null };
    }
  },

  detectDeviceType(userAgent?: string): string {
    if (!userAgent) return "unknown";
    
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    }
    return "desktop";
  }
};