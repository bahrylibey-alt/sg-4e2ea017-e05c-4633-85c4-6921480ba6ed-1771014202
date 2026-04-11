import { supabase } from "@/integrations/supabase/client";

/**
 * REAL TRAFFIC SOURCES v2.0
 * 
 * PURPOSE: Provides real free traffic source strategies
 * 
 * IMPORTANT NOTES:
 * ✅ Traffic tracking is REAL (tracks actual clicks/views/conversions)
 * ✅ Posting instructions are REAL and tested
 * ⚠️ "estimated_daily_visitors" are POTENTIAL numbers (not guaranteed)
 * ⚠️ Automation requires Zapier integration or manual posting
 * 
 * These are proven traffic sources that work when you:
 * 1. Create quality content
 * 2. Post consistently
 * 3. Follow platform best practices
 */

export interface TrafficSource {
  platform: string;
  method: string;
  estimated_daily_visitors: number; // POTENTIAL traffic (not guaranteed)
  difficulty: "easy" | "medium" | "hard";
  automation_available: boolean;
  requires_api: boolean;
  instructions: string;
}

export const REAL_TRAFFIC_SOURCES: TrafficSource[] = [
  {
    platform: "Pinterest",
    method: "Product pins with SEO keywords",
    estimated_daily_visitors: 100, // Potential with consistent posting
    difficulty: "easy",
    automation_available: true,
    requires_api: false, // Can use Zapier
    instructions: "Connect Pinterest via Zapier → Auto-pin products daily"
  },
  {
    platform: "Twitter/X",
    method: "Trending hashtag posts + deals",
    estimated_daily_visitors: 50, // Potential with consistent posting
    difficulty: "easy",
    automation_available: true,
    requires_api: false,
    instructions: "Connect Twitter via Zapier → Auto-tweet hot deals"
  },
  {
    platform: "Reddit",
    method: "Value posts in niche subreddits",
    estimated_daily_visitors: 200, // Potential with quality posts
    difficulty: "medium",
    automation_available: false, // Reddit anti-spam is strict
    requires_api: false,
    instructions: "Manually share valuable content in r/deals, r/frugal, etc."
  },
  {
    platform: "Facebook Groups",
    method: "Join niche groups, share products",
    estimated_daily_visitors: 150, // Potential with consistent posting
    difficulty: "easy",
    automation_available: true,
    requires_api: false,
    instructions: "Connect Facebook via Zapier → Auto-share to groups"
  },
  {
    platform: "TikTok",
    method: "Short product review videos",
    estimated_daily_visitors: 500, // Potential with viral content
    difficulty: "hard",
    automation_available: false,
    requires_api: false,
    instructions: "Create 15-second product videos with trending sounds"
  },
  {
    platform: "YouTube Community",
    method: "Product polls and images",
    estimated_daily_visitors: 80, // Potential with subscriber base
    difficulty: "medium",
    automation_available: false,
    requires_api: true,
    instructions: "Post product polls to your YouTube Community tab"
  },
  {
    platform: "Instagram Stories",
    method: "Product story templates",
    estimated_daily_visitors: 120, // Potential with consistent posting
    difficulty: "easy",
    automation_available: true,
    requires_api: false,
    instructions: "Connect Instagram via Zapier → Auto-post stories"
  },
  {
    platform: "LinkedIn Articles",
    method: "Professional product roundups",
    estimated_daily_visitors: 60, // Potential with professional network
    difficulty: "medium",
    automation_available: false,
    requires_api: false,
    instructions: "Publish articles like 'Top 10 Tools for Remote Work'"
  }
];

/**
 * Get traffic sources that can be automated via Zapier
 */
export function getAutomatableTrafficSources(): TrafficSource[] {
  return REAL_TRAFFIC_SOURCES.filter(source => source.automation_available && !source.requires_api);
}

/**
 * Calculate POTENTIAL daily traffic (not guaranteed)
 */
export function calculatePotentialTraffic(enabledPlatforms: string[]): number {
  const potential = REAL_TRAFFIC_SOURCES
    .filter(source => enabledPlatforms.includes(source.platform))
    .reduce((total, source) => total + source.estimated_daily_visitors, 0);
  
  return potential;
}

/**
 * Track REAL traffic event (actual clicks/views)
 */
export async function trackTrafficEvent(data: {
  userId: string;
  visitorId: string;
  eventType: "pageview" | "click" | "conversion";
  pageUrl: string;
  referrer?: string;
  deviceType?: string;
  country?: string;
  productId?: string;
  revenue?: number;
}) {
  try {
    const { error } = await supabase
      .from("traffic_events")
      .insert({
        user_id: data.userId,
        visitor_id: data.visitorId,
        event_type: data.eventType,
        page_url: data.pageUrl,
        referrer: data.referrer,
        device_type: data.deviceType,
        country: data.country,
        product_id: data.productId,
        revenue: data.revenue
      });

    if (error) {
      console.error("Failed to track traffic event:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error tracking traffic:", error);
    return false;
  }
}

/**
 * Get REAL traffic stats (last 24 hours from database)
 */
export async function getRealTimeTrafficStats(userId: string) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("traffic_events")
      .select("event_type, referrer, revenue, created_at")
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);

    if (error) throw error;

    const stats = {
      pageviews: data?.filter(e => e.event_type === "pageview").length || 0,
      clicks: data?.filter(e => e.event_type === "click").length || 0,
      conversions: data?.filter(e => e.event_type === "conversion").length || 0,
      revenue: data?.reduce((sum, e) => sum + (e.revenue || 0), 0) || 0,
      topReferrers: getTopReferrers(data || [])
    };

    return stats;
  } catch (error) {
    console.error("Error getting traffic stats:", error);
    return null;
  }
}

function getTopReferrers(events: any[]): { referrer: string; count: number }[] {
  const referrerCounts: Record<string, number> = {};
  
  events.forEach(event => {
    if (event.referrer) {
      referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
    }
  });

  return Object.entries(referrerCounts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}