import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  async createLink(data: {
    original_url: string;
    product_name?: string;
    network?: string;
    commission_rate?: number;
  }): Promise<{ link: AffiliateLink | null; error: string | null }> {
    try {
      console.log("🔗 Creating affiliate link for:", data.original_url);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ No user authenticated");
        return { link: null, error: "User not authenticated" };
      }

      console.log("✅ User:", user.id);

      // Ensure profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        console.log("📝 Creating user profile...");
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || null,
          full_name: null
        });
      }

      const slug = await this.generateUniqueSlug();
      const cloakedUrl = this.getCloakedUrl(slug);

      console.log("✅ Generated slug:", slug);

      const insertData: AffiliateLinkInsert = {
        user_id: user.id,
        original_url: data.original_url,
        cloaked_url: cloakedUrl,
        slug,
        product_name: data.product_name || this.extractProductName(data.original_url),
        network: data.network || "direct",
        commission_rate: data.commission_rate || 10,
        clicks: 0,
        conversion_count: 0,
        commission_earned: 0,
        status: "active"
      };

      console.log("📝 Inserting link:", insertData.product_name);

      const { data: link, error } = await supabase
        .from("affiliate_links")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Link creation error:", error);
        return { link: null, error: error.message };
      }

      console.log("✅ Link created successfully:", link.id);
      return { link, error: null };
    } catch (err) {
      console.error("💥 Link creation exception:", err);
      return { link: null, error: "Failed to create link" };
    }
  },

  async createBatchLinks(urls: Array<{
    original_url: string;
    product_name?: string;
    network?: string;
    commission_rate?: number;
  }>): Promise<{ 
    links: AffiliateLink[]; 
    errors: string[]; 
    successCount: number;
  }> {
    const links: AffiliateLink[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // Ensure user profile exists once before batch
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || null,
          full_name: null
        });
      }
    }

    for (const urlData of urls) {
      const result = await this.createLink(urlData);
      if (result.link) {
        links.push(result.link);
        successCount++;
      } else {
        errors.push(result.error || "Unknown error");
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { links, errors, successCount };
  },

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
    } catch (err) {
      console.error("Unexpected error:", err);
      return { links: [], error: "Failed to fetch links" };
    }
  },

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
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq("id", link.id);

      return { success: true, redirect_url: link.original_url, linkId: link.id };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { success: false, redirect_url: null, linkId: null };
    }
  },

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
          commission_earned: (link.commission_earned || 0) + revenue
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
    } catch (err) {
      return { success: false, error: "Failed to track conversion" };
    }
  },

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
    } catch (err) {
      return { success: false, error: "Failed to update link" };
    }
  },

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
    } catch (err) {
      return { success: false, updated: 0, error: "Bulk update failed" };
    }
  },

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
    } catch (err) {
      return { success: false, error: "Failed to delete link" };
    }
  },

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
    } catch (err) {
      return { success: false, deleted: 0, error: "Bulk delete failed" };
    }
  },

  async generateUniqueSlug(length: number = 8, attempts: number = 0): Promise<string> {
    if (attempts > 10) {
      throw new Error("Failed to generate unique slug");
    }

    const slug = this.generateSlug(length);
    
    const { data } = await supabase
      .from("affiliate_links")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (data) {
      return this.generateUniqueSlug(length + 1, attempts + 1);
    }

    return slug;
  },

  generateSlug(length: number = 8): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let slug = "";
    for (let i = 0; i < length; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  },

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

  getCloakedUrl(slug: string): string {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/go/${slug}`;
    }
    return `https://salemakseb.com/go/${slug}`;
  },

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
    } catch (err) {
      return { links: [], error: "Failed to fetch top links" };
    }
  }
};