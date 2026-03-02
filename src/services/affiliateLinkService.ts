import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { authService } from "@/services/authService";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];
type AffiliateLinkInsert = Database["public"]["Tables"]["affiliate_links"]["Insert"];

export interface LinkAnalytics {
  linkId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgOrderValue: number;
  topCountries: Array<{ country: string; clicks: number }>;
  topDevices: Array<{ device: string; clicks: number }>;
  hourlyData: Array<{ hour: string; clicks: number }>;
}

export const affiliateLinkService = {
  /**
   * Generate unique short code for affiliate links
   */
  generateShortCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Generate a unique slug for a product (Helper method)
   */
  generateUniqueSlug(productName: string): string {
    const shortCode = this.generateShortCode();
    return `${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)}-${shortCode}`;
  },

  /**
   * Create a new affiliate link (MAIN METHOD - Used by UI components)
   */
  async createAffiliateLink(params: {
    productId?: string;
    productName: string;
    destinationUrl: string;
    network?: string;
    commissionRate?: number;
    customSlug?: string;
  }): Promise<{
    success: boolean;
    link?: AffiliateLink;
    shortUrl?: string;
    error?: string;
  }> {
    console.log("🔗 Creating affiliate link:", params.productName);

    try {
      // Get authenticated user
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) {
        console.error("❌ No authenticated user");
        return { 
          success: false, 
          error: "Authentication required to create affiliate links" 
        };
      }

      // Validate destination URL
      if (!params.destinationUrl || params.destinationUrl.trim() === "") {
        console.error("❌ Empty destination URL");
        return {
          success: false,
          error: "Destination URL is required"
        };
      }

      // Generate unique slug
      const shortCode = this.generateShortCode();
      const slug = params.customSlug || 
        `${params.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)}-${shortCode}`;
      
      console.log("✅ Generated slug:", slug);

      // Generate the cloaked URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://salemakseb.com';
      const cloakedUrl = `${baseUrl}/go/${slug}`;

      console.log("✅ Cloaked URL:", cloakedUrl);
      console.log("✅ Destination:", params.destinationUrl);

      // Insert into database with ALL required fields
      const insertData: AffiliateLinkInsert = {
        user_id: session.user.id,
        product_id: params.productId || null,
        product_name: params.productName,
        original_url: params.destinationUrl, // CRITICAL: Real destination URL
        cloaked_url: cloakedUrl,
        slug: slug,
        short_code: shortCode,
        network: params.network || "Direct",
        commission_rate: params.commissionRate || 0,
        clicks: 0,
        click_count: 0,
        conversions: 0,
        conversion_count: 0,
        revenue: 0,
        commission_earned: 0,
        status: "active"
      };

      console.log("📝 Inserting link to database...");
      const { data, error } = await supabase
        .from("affiliate_links")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to create affiliate link:", error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      console.log("✅ Affiliate link created successfully!");
      console.log("   ID:", data.id);
      console.log("   Slug:", data.slug);
      console.log("   Short URL:", cloakedUrl);
      console.log("   Destination:", data.original_url);

      return { 
        success: true, 
        link: data,
        shortUrl: cloakedUrl
      };
    } catch (error: any) {
      console.error("💥 Exception creating affiliate link:", error);
      return { 
        success: false, 
        error: error.message || "Failed to create affiliate link" 
      };
    }
  },

  /**
   * Create link (Alternative method - kept for backward compatibility)
   */
  async createLink(data: {
    original_url: string;
    product_name?: string;
    product_id?: string;
    network?: string;
    commission_rate?: number;
  }): Promise<{ link: AffiliateLink | null; error: string | null }> {
    const result = await this.createAffiliateLink({
      productId: data.product_id,
      productName: data.product_name || this.extractProductName(data.original_url),
      destinationUrl: data.original_url,
      network: data.network,
      commissionRate: data.commission_rate
    });

    if (result.success && result.link) {
      return { link: result.link, error: null };
    } else {
      return { link: null, error: result.error || "Failed to create link" };
    }
  },

  /**
   * Create multiple links in batch
   */
  async createBatchLinks(urls: Array<{
    original_url: string;
    product_name?: string;
    product_id?: string;
    network?: string;
    commission_rate?: number;
  }>): Promise<{ 
    links: AffiliateLink[]; 
    errors: string[]; 
    successCount: number;
  }> {
    console.log(`📦 Creating ${urls.length} affiliate links in batch...`);
    
    const links: AffiliateLink[] = [];
    const errors: string[] = [];
    let successCount = 0;

    for (const urlData of urls) {
      const result = await this.createAffiliateLink({
        productId: urlData.product_id,
        productName: urlData.product_name || this.extractProductName(urlData.original_url),
        destinationUrl: urlData.original_url,
        network: urlData.network,
        commissionRate: urlData.commission_rate
      });

      if (result.success && result.link) {
        links.push(result.link);
        successCount++;
      } else {
        errors.push(result.error || "Unknown error");
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Batch complete: ${successCount} successful, ${errors.length} failed`);
    return { links, errors, successCount };
  },

  /**
   * Get user's affiliate links with optional filters
   */
  async getUserLinks(filters?: {
    status?: "active" | "paused" | "archived";
    network?: string;
    minClicks?: number;
    minRevenue?: number;
  }): Promise<{ links: AffiliateLink[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { links: [], error: "User not authenticated" };
      }

      let query = supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.network) {
        query = query.eq("network", filters.network);
      }
      if (filters?.minClicks !== undefined) {
        query = query.gte("clicks", filters.minClicks);
      }
      if (filters?.minRevenue !== undefined) {
        query = query.gte("commission_earned", filters.minRevenue);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching links:", error);
        return { links: [], error: error.message };
      }

      return { links: data || [], error: null };
    } catch (err: any) {
      console.error("Unexpected error:", err);
      return { links: [], error: "Failed to fetch links" };
    }
  },

  /**
   * Track click (used by redirect page)
   */
  async trackClick(slug: string, metadata?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    country?: string;
    device_type?: string;
  }): Promise<{ success: boolean; redirect_url: string | null; linkId: string | null }> {
    try {
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (linkError || !link) {
        console.error("Link not found:", linkError);
        return { success: false, redirect_url: null, linkId: null };
      }

      const { error: clickError } = await supabase
        .from("click_events")
        .insert({
          link_id: link.id,
          user_id: link.user_id,
          ip_address: metadata?.ip_address || null,
          user_agent: metadata?.user_agent || null,
          referrer: metadata?.referrer || null,
          country: metadata?.country || null,
          device_type: metadata?.device_type || this.detectDeviceType(metadata?.user_agent)
        });

      if (clickError) {
        console.error("Error tracking click:", clickError);
      }

      await supabase
        .from("affiliate_links")
        .update({ 
          clicks: (link.clicks || 0) + 1,
          click_count: (link.click_count || 0) + 1
        })
        .eq("id", link.id);

      return { success: true, redirect_url: link.original_url, linkId: link.id };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { success: false, redirect_url: null, linkId: null };
    }
  },

  /**
   * Track conversion
   */
  async trackConversion(linkId: string, revenue: number): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("id", linkId)
        .single();

      if (!link) {
        return { success: false, error: "Link not found" };
      }

      await supabase
        .from("affiliate_links")
        .update({
          conversion_count: (link.conversion_count || 0) + 1,
          conversions: (link.conversions || 0) + 1,
          commission_earned: (link.commission_earned || 0) + revenue,
          revenue: (link.revenue || 0) + revenue
        })
        .eq("id", linkId);

      const { data: recentClick } = await supabase
        .from("click_events")
        .select("*")
        .eq("link_id", linkId)
        .order("clicked_at", { ascending: false })
        .limit(1)
        .single();

      if (recentClick) {
        await supabase
          .from("click_events")
          .update({ converted: true })
          .eq("id", recentClick.id);
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to track conversion" };
    }
  },

  /**
   * Get link analytics
   */
  async getLinkAnalytics(linkId: string): Promise<LinkAnalytics | null> {
    try {
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("id", linkId)
        .single();

      if (!link) return null;

      const { data: clicks } = await supabase
        .from("click_events")
        .select("*")
        .eq("link_id", linkId)
        .order("clicked_at", { ascending: false });

      const clicksArray = clicks || [];
      const conversionRate = link.clicks > 0 
        ? ((link.conversion_count || 0) / link.clicks) * 100 
        : 0;
      const avgOrderValue = (link.conversion_count || 0) > 0 
        ? (link.commission_earned || 0) / (link.conversion_count || 0) 
        : 0;

      const countryMap = new Map<string, number>();
      clicksArray.forEach(click => {
        if (click.country) {
          countryMap.set(click.country, (countryMap.get(click.country) || 0) + 1);
        }
      });
      const topCountries = Array.from(countryMap.entries())
        .map(([country, clicks]) => ({ country, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      const deviceMap = new Map<string, number>();
      clicksArray.forEach(click => {
        if (click.device_type) {
          deviceMap.set(click.device_type, (deviceMap.get(click.device_type) || 0) + 1);
        }
      });
      const topDevices = Array.from(deviceMap.entries())
        .map(([device, clicks]) => ({ device, clicks }))
        .sort((a, b) => b.clicks - a.clicks);

      const hourlyMap = new Map<string, number>();
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        hourlyMap.set(hour.toISOString().slice(0, 13), 0);
      }
      clicksArray.forEach(click => {
        const hour = new Date(click.clicked_at).toISOString().slice(0, 13);
        if (hourlyMap.has(hour)) {
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        }
      });
      const hourlyData = Array.from(hourlyMap.entries())
        .map(([hour, clicks]) => ({
          hour: new Date(hour).toLocaleTimeString("en-US", { hour: "2-digit" }),
          clicks
        }));

      return {
        linkId: link.id,
        clicks: link.clicks || 0,
        conversions: link.conversion_count || 0,
        revenue: link.commission_earned || 0,
        conversionRate,
        avgOrderValue,
        topCountries,
        topDevices,
        hourlyData
      };
    } catch (err) {
      console.error("Analytics error:", err);
      return null;
    }
  },

  /**
   * Toggle link status
   */
  async toggleLinkStatus(linkId: string, status: "active" | "paused" | "archived"): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("affiliate_links")
        .update({ status })
        .eq("id", linkId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update link" };
    }
  },

  /**
   * Bulk update status
   */
  async bulkUpdateStatus(linkIds: string[], status: "active" | "paused" | "archived"): Promise<{
    success: boolean;
    updated: number;
    error: string | null;
  }> {
    try {
      const { error, count } = await supabase
        .from("affiliate_links")
        .update({ status })
        .in("id", linkIds);

      if (error) {
        return { success: false, updated: 0, error: error.message };
      }

      return { success: true, updated: count || 0, error: null };
    } catch (err: any) {
      return { success: false, updated: 0, error: err.message || "Bulk update failed" };
    }
  },

  /**
   * Delete link
   */
  async deleteLink(linkId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("affiliate_links")
        .delete()
        .eq("id", linkId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete link" };
    }
  },

  /**
   * Bulk delete links
   */
  async bulkDeleteLinks(linkIds: string[]): Promise<{
    success: boolean;
    deleted: number;
    error: string | null;
  }> {
    try {
      const { error, count } = await supabase
        .from("affiliate_links")
        .delete()
        .in("id", linkIds);

      if (error) {
        return { success: false, deleted: 0, error: error.message };
      }

      return { success: true, deleted: count || 0, error: null };
    } catch (err: any) {
      return { success: false, deleted: 0, error: err.message || "Bulk delete failed" };
    }
  },

  /**
   * Extract product name from URL
   */
  extractProductName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || "Product";
      return lastPart
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .slice(0, 50);
    } catch {
      return "Product";
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
   * Get cloaked URL
   */
  getCloakedUrl(slug: string): string {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/go/${slug}`;
    }
    return `https://salemakseb.com/go/${slug}`;
  },

  /**
   * Get top performing links
   */
  async getTopPerformingLinks(limit: number = 10): Promise<{
    links: AffiliateLink[];
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { links: [], error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("commission_earned", { ascending: false })
        .limit(limit);

      if (error) {
        return { links: [], error: error.message };
      }

      return { links: data || [], error: null };
    } catch (err: any) {
      return { links: [], error: err.message || "Failed to fetch top links" };
    }
  }
};