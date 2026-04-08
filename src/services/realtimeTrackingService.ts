import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { activityLogger } from "@/services/activityLogger";
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
    console.log("🔄 Subscribing to click events for user:", userId);

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
          console.log("🔔 New click event received:", payload);
          const clickEvent = payload.new as ClickEvent;
          
          // Get link details with error handling
          const { data: link, error } = await supabase
            .from("affiliate_links")
            .select("product_name")
            .eq("id", clickEvent.link_id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching link details:", error);
          }

          const event: LiveActivity = {
            id: clickEvent.id,
            type: "click",
            timestamp: clickEvent.clicked_at,
            product: link?.product_name || "Unknown Product",
            source: clickEvent.referrer || "Direct",
            country: clickEvent.country || undefined
          };

          // Log to activity logger
          await activityLogger.logSystemActivity(
            "click_received",
            `Click on ${event.product} from ${event.source}`,
            { clickId: clickEvent.id, product: event.product }
          );

          onEvent(event);
        }
      )
      .subscribe((status) => {
        console.log("📡 Click events subscription status:", status);
      });

    return channel;
  },

  // Subscribe to real-time commission events
  subscribeToCommissionEvents(
    userId: string,
    onEvent: (event: LiveActivity) => void
  ) {
    console.log("🔄 Subscribing to commission events for user:", userId);

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
          console.log("🔔 New commission received:", payload);
          const commission = payload.new as Commission;
          
          // Get link details with error handling
          const { data: link, error } = await supabase
            .from("affiliate_links")
            .select("product_name")
            .eq("id", commission.link_id || "")
            .maybeSingle();

          if (error) {
            console.error("Error fetching link for commission:", error);
          }

          const event: LiveActivity = {
            id: commission.id,
            type: commission.status === "paid" ? "commission" : "conversion",
            timestamp: commission.created_at,
            product: link?.product_name || "Unknown Product",
            amount: Number(commission.amount) || 0
          };

          // Log to activity logger
          await activityLogger.logSystemActivity(
            "commission_earned",
            `Commission of $${event.amount} earned on ${event.product}`,
            { commissionId: commission.id, amount: event.amount }
          );

          onEvent(event);
        }
      )
      .subscribe((status) => {
        console.log("📡 Commission events subscription status:", status);
      });

    return channel;
  },

  // Get real-time statistics
  async getRealtimeStats(): Promise<RealtimeStats> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        console.log("No user for realtime stats");
        return {
          activeLinks: 0,
          todayClicks: 0,
          todayConversions: 0,
          todayRevenue: 0,
          liveVisitors: 0,
          topPerformers: []
        };
      }

      console.log("📊 Fetching realtime stats for user:", user.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // Get active links count
      const { data: links, error: linksError } = await supabase
        .from("affiliate_links")
        .select("id, product_name, clicks, commission_earned")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (linksError) {
        console.error("Error fetching active links:", linksError);
      }

      const activeLinks = links?.length || 0;
      console.log(`🔗 Active links: ${activeLinks}`);

      // Get today's clicks
      const { data: todayClicks, error: clicksError } = await supabase
        .from("click_events")
        .select("id, link_id, converted")
        .eq("user_id", user.id)
        .gte("clicked_at", todayStr);

      if (clicksError) {
        console.error("Error fetching today's clicks:", clicksError);
      }

      const todayClicksCount = todayClicks?.length || 0;
      console.log(`👆 Today's clicks: ${todayClicksCount}`);

      // Get today's conversions
      const convertedClicks = todayClicks?.filter(c => c.converted === true) || [];
      const todayConversions = convertedClicks.length;
      console.log(`✅ Today's conversions: ${todayConversions}`);

      // Get today's commissions
      const { data: todayCommissions, error: commissionsError } = await supabase
        .from("commissions")
        .select("amount, link_id")
        .eq("user_id", user.id)
        .gte("created_at", todayStr);

      if (commissionsError) {
        console.error("Error fetching today's commissions:", commissionsError);
      }

      const todayRevenue = todayCommissions?.reduce(
        (sum, c) => sum + Number(c.amount || 0),
        0
      ) || 0;
      console.log(`💰 Today's revenue: $${todayRevenue}`);

      // Get live visitors (clicks in last 5 minutes)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentClicks, error: recentError } = await supabase
        .from("click_events")
        .select("id")
        .eq("user_id", user.id)
        .gte("clicked_at", fiveMinAgo);

      if (recentError) {
        console.error("Error fetching recent clicks:", recentError);
      }

      const liveVisitors = recentClicks?.length || 0;
      console.log(`👥 Live visitors: ${liveVisitors}`);

      // Get top performers
      const topPerformers = (links || [])
        .sort((a, b) => (b.commission_earned || 0) - (a.commission_earned || 0))
        .slice(0, 5)
        .map(link => ({
          product: link.product_name || "Unknown",
          clicks: link.clicks || 0,
          revenue: link.commission_earned || 0
        }));

      console.log(`🏆 Top performers: ${topPerformers.length}`);

      return {
        activeLinks,
        todayClicks: todayClicksCount,
        todayConversions,
        todayRevenue,
        liveVisitors,
        topPerformers
      };
    } catch (error) {
      console.error("❌ Error fetching realtime stats:", error);
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
      if (!user) {
        console.log("No user for recent activity");
        return [];
      }

      console.log("📝 Fetching recent activity for user:", user.id);

      // Get recent clicks with link info
      const { data: clicks, error: clicksError } = await supabase
        .from("click_events")
        .select("*, affiliate_links(product_name)")
        .eq("user_id", user.id)
        .order("clicked_at", { ascending: false })
        .limit(limit);

      if (clicksError) {
        console.error("Error fetching recent clicks:", clicksError);
      }

      // Get recent commissions with link info
      const { data: commissions, error: commissionsError } = await supabase
        .from("commissions")
        .select("*, affiliate_links(product_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (commissionsError) {
        console.error("Error fetching recent commissions:", commissionsError);
      }

      const activities: LiveActivity[] = [];

      // Add clicks
      clicks?.forEach(click => {
        activities.push({
          id: click.id,
          type: "click",
          timestamp: click.clicked_at,
          product: (click.affiliate_links as any)?.product_name || "Unknown",
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
          product: (comm.affiliate_links as any)?.product_name || "Unknown",
          amount: Number(comm.amount) || 0
        });
      });

      // Sort by timestamp and limit
      const sorted = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      console.log(`✅ Retrieved ${sorted.length} recent activities`);

      return sorted;
    } catch (error) {
      console.error("❌ Error fetching activity:", error);
      return [];
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
      console.log("📍 Tracking enhanced click for link:", linkId);

      // Get the link to ensure it exists and get user_id
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .select("user_id, clicks")
        .eq("id", linkId)
        .maybeSingle();

      if (linkError || !link) {
        console.error("Link not found:", linkError);
        return { success: false, clickId: null };
      }

      // Insert click event with user_id from link
      const { data: click, error } = await supabase
        .from("click_events")
        .insert({
          link_id: linkId,
          user_id: link.user_id,
          ip_address: metadata.ip_address || null,
          user_agent: metadata.user_agent || null,
          referrer: metadata.referrer || null,
          country: null,
          device_type: this.detectDeviceType(metadata.user_agent)
        })
        .select()
        .single();

      if (error || !click) {
        console.error("Error inserting click event:", error);
        return { success: false, clickId: null };
      }

      console.log("✅ Click tracked:", click.id);

      // Update link click count
      await supabase
        .from("affiliate_links")
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq("id", linkId);

      // Log activity
      await activityLogger.logSystemActivity(
        "click_tracked",
        `Click tracked for link ${linkId}`,
        { clickId: click.id, linkId, metadata }
      );

      return { success: true, clickId: click.id };
    } catch (error) {
      console.error("❌ Error tracking click:", error);
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