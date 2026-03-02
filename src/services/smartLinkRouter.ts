import { supabase } from "@/integrations/supabase/client";

/**
 * Smart Link Router with Advanced Techniques
 * - Intelligent caching
 * - Fuzzy matching fallback
 * - Bot detection
 * - Geographic routing
 * - A/B testing
 */

interface LinkLookupResult {
  found: boolean;
  link?: any;
  destinationUrl?: string;
  variant?: string;
  error?: string;
}

interface ClickMetadata {
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
  country?: string;
  deviceType?: string;
}

export const smartLinkRouter = {
  // In-memory cache for frequently accessed links
  linkCache: new Map<string, { link: any; timestamp: number }>(),
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  /**
   * Smart link lookup with caching and fallback
   */
  async findLink(slug: string): Promise<LinkLookupResult> {
    // 1. Check cache first (fastest path)
    const cached = this.linkCache.get(slug);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log("✅ Cache hit for slug:", slug);
      return { found: true, link: cached.link, destinationUrl: cached.link.original_url };
    }

    // 2. Direct database lookup
    const { data: link, error } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (link) {
      // Cache the result
      this.linkCache.set(slug, { link, timestamp: Date.now() });
      console.log("✅ Direct lookup successful:", slug);
      return { found: true, link, destinationUrl: link.original_url };
    }

    // 3. Fuzzy matching fallback (smart technique)
    console.log("⚠️ Direct lookup failed, trying fuzzy match...");
    const fuzzyResult = await this.fuzzyMatchLink(slug);
    if (fuzzyResult.found) {
      return fuzzyResult;
    }

    // 4. Check if link exists but is paused/archived
    const { data: inactiveLink } = await supabase
      .from("affiliate_links")
      .select("slug, status")
      .eq("slug", slug)
      .maybeSingle();

    if (inactiveLink) {
      return {
        found: false,
        error: `This link is ${inactiveLink.status} and cannot be used`
      };
    }

    return { found: false, error: "Link not found" };
  },

  /**
   * Fuzzy matching for typos and variations
   */
  async fuzzyMatchLink(slug: string): Promise<LinkLookupResult> {
    // Remove hyphens and try variations
    const cleanSlug = slug.replace(/-/g, "");
    
    // Search for similar slugs (case-insensitive, partial match)
    const { data: similarLinks } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("status", "active")
      .ilike("slug", `%${slug.substring(0, 10)}%`)
      .limit(1);

    if (similarLinks && similarLinks.length > 0) {
      const link = similarLinks[0];
      console.log("✅ Fuzzy match found:", link.slug, "for", slug);
      return { found: true, link, destinationUrl: link.original_url };
    }

    return { found: false };
  },

  /**
   * Get destination URL with A/B testing and geo-routing
   */
  async getSmartDestination(linkId: string, metadata: ClickMetadata): Promise<string> {
    const destinationUrl = "";

    // 1. Check for geographic routing rules
    if (metadata.country) {
      const { data: geoRule } = await supabase
        .from("geo_routing_rules")
        .select("destination_url")
        .eq("link_id", linkId)
        .eq("country_code", metadata.country)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (geoRule) {
        console.log("🌍 Using geo-routing for", metadata.country);
        return geoRule.destination_url;
      }
    }

    // 2. Check for A/B test variants
    const { data: variants } = await supabase
      .from("link_variants")
      .select("*")
      .eq("parent_link_id", linkId)
      .eq("is_active", true);

    if (variants && variants.length > 0) {
      // Weighted random selection based on traffic percentage
      const totalWeight = variants.reduce((sum, v) => sum + (v.traffic_percentage || 0), 0);
      const random = Math.random() * totalWeight;
      
      let cumulative = 0;
      for (const variant of variants) {
        cumulative += variant.traffic_percentage || 0;
        if (random <= cumulative) {
          console.log("🧪 A/B test variant selected:", variant.variant_name);
          
          // Track variant click
          await supabase
            .from("link_variants")
            .update({ clicks: (variant.clicks || 0) + 1 })
            .eq("id", variant.id);

          return variant.destination_url;
        }
      }
    }

    // 3. Return default destination URL from original link
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("original_url")
      .eq("id", linkId)
      .single();

    return link?.original_url || "";
  },

  /**
   * Bot detection and fraud scoring
   */
  detectBot(userAgent?: string): { isBot: boolean; fraudScore: number } {
    if (!userAgent) {
      return { isBot: false, fraudScore: 0.0 };
    }

    const ua = userAgent.toLowerCase();
    
    // Known bot patterns
    const botPatterns = [
      "bot", "crawler", "spider", "scraper", "curl", "wget",
      "python", "java", "ruby", "perl", "php", "go-http-client"
    ];

    const isBot = botPatterns.some(pattern => ua.includes(pattern));
    
    // Calculate fraud score based on various factors
    let fraudScore = 0.0;
    
    if (isBot) fraudScore += 0.8;
    if (!ua.includes("mozilla")) fraudScore += 0.3;
    if (ua.length < 20) fraudScore += 0.4;
    if (!ua.includes("applewebkit") && !ua.includes("gecko")) fraudScore += 0.2;
    
    // Cap at 1.0
    fraudScore = Math.min(fraudScore, 1.0);

    return { isBot, fraudScore };
  },

  /**
   * Track click with advanced metadata
   */
  async trackSmartClick(
    linkId: string,
    userId: string | null,
    metadata: ClickMetadata
  ): Promise<void> {
    const { isBot, fraudScore } = this.detectBot(metadata.userAgent);

    // Record click with all metadata
    const { error } = await supabase
      .from("click_events")
      .insert({
        link_id: linkId,
        user_id: userId,
        clicked_at: new Date().toISOString(),
        user_agent: metadata.userAgent || null,
        referrer: metadata.referrer || null,
        device_type: metadata.deviceType || this.detectDeviceType(metadata.userAgent),
        ip_address: metadata.ipAddress || null,
        is_bot: isBot,
        fraud_score: fraudScore
      });

    if (error) {
      console.error("⚠️ Failed to track click:", error);
    }

    // Update link counters (only for non-bot traffic)
    if (!isBot || fraudScore < 0.7) {
      // Use RPC for atomic increment to prevent race conditions
      const { error } = await supabase.rpc('increment_link_clicks', { 
        link_uuid: linkId 
      });

      if (error) {
        console.error("⚠️ Failed to increment clicks:", error);
      }
    } else {
      console.log("🤖 Bot detected, not counting click");
    }
  },

  /**
   * Detect device type from user agent
   */
  detectDeviceType(userAgent?: string): string {
    if (!userAgent) return "unknown";
    
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    } else {
      return "desktop";
    }
  },

  /**
   * Check link health (verify destination URL is accessible)
   */
  async checkLinkHealth(linkId: string): Promise<boolean> {
    try {
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("original_url")
        .eq("id", linkId)
        .single();

      if (!link) return false;

      // Try to fetch the destination URL (HEAD request)
      const response = await fetch(link.original_url, { 
        method: "HEAD",
        redirect: "follow"
      });

      const isWorking = response.ok;

      // Update link health status using atomic RPC
      await supabase.rpc('update_link_health_status', {
        link_uuid: linkId,
        is_healthy: isWorking
      });

      return isWorking;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return false;
    }
  },

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [slug, cached] of this.linkCache.entries()) {
      if (now - cached.timestamp >= this.CACHE_TTL) {
        this.linkCache.delete(slug);
      }
    }
  }
};

// Auto-clear expired cache every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    smartLinkRouter.clearExpiredCache();
  }, 5 * 60 * 1000);
}