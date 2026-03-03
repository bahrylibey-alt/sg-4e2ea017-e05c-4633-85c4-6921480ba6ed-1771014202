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
    console.log("🎯 Destination URL:", params.destinationUrl);

    try {
      // CRITICAL VALIDATION: Ensure destination URL is REAL and valid
      if (!params.destinationUrl || params.destinationUrl.trim() === "") {
        console.error("❌ Empty destination URL");
        return {
          success: false,
          error: "Destination URL is required"
        };
      }

      // Validate URL format and ensure it's a real product URL
      try {
        const urlTest = new URL(params.destinationUrl);
        console.log("✅ Valid URL format:", urlTest.hostname);
        
        // Additional validation: Ensure it's not a placeholder URL
        const invalidPatterns = [
          "example.com",
          "placeholder",
          "test.com",
          "localhost",
          "0.0.0.0"
        ];
        
        const isInvalid = invalidPatterns.some(pattern => 
          params.destinationUrl.toLowerCase().includes(pattern)
        );
        
        if (isInvalid) {
          console.error("❌ Invalid placeholder URL detected:", params.destinationUrl);
          return {
            success: false,
            error: "Please provide a real product URL, not a placeholder"
          };
        }
      } catch (urlError) {
        console.error("❌ Invalid URL format:", params.destinationUrl);
        return {
          success: false,
          error: "Invalid URL format"
        };
      }

      // Get authenticated user
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) {
        console.error("❌ No authenticated user");
        return { 
          success: false, 
          error: "Authentication required to create affiliate links" 
        };
      }

      console.log("✅ User authenticated:", session.user.id);

      // Generate unique slug and short code
      const shortCode = this.generateShortCode();
      const baseSlug = params.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 30);
      const slug = params.customSlug || `${baseSlug}-${shortCode}`;
      
      console.log("✅ Generated slug:", slug);
      console.log("✅ Generated short code:", shortCode);

      // CRITICAL: Validate product_id - MUST be valid UUID or null
      let validatedProductId: string | null = null;
      if (params.productId) {
        // UUID format: 8-4-4-4-12 hexadecimal characters
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(params.productId)) {
          validatedProductId = params.productId;
          console.log("✅ Valid UUID product_id:", validatedProductId);
        } else {
          console.warn("⚠️ Invalid product_id format (not UUID), setting to null:", params.productId);
          validatedProductId = null;
        }
      } else {
        console.log("✅ No product_id provided, using null (catalog product)");
        validatedProductId = null;
      }

      // Generate the cloaked URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://salemakseb.com';
      const cloakedUrl = `${baseUrl}/go/${slug}`;

      console.log("✅ Cloaked URL:", cloakedUrl);
      console.log("🎯 Will redirect to:", params.destinationUrl);
      console.log("📊 Product:", params.productName);
      console.log("💰 Commission Rate:", params.commissionRate);

      // Insert into database with ALL required fields
      const insertData: AffiliateLinkInsert = {
        user_id: session.user.id,
        product_id: validatedProductId, // CRITICAL: Only valid UUID or null
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
      console.log("📝 Insert data:", JSON.stringify(insertData, null, 2));

      const { data, error } = await supabase
        .from("affiliate_links")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to create affiliate link:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        return { 
          success: false, 
          error: error.message 
        };
      }

      // VERIFICATION: Confirm the link was saved correctly
      console.log("✅ Affiliate link created successfully!");
      console.log("   ID:", data.id);
      console.log("   Slug:", data.slug);
      console.log("   Short URL:", cloakedUrl);
      console.log("   Original URL (saved):", data.original_url);
      console.log("   Status:", data.status);

      // Double-check: Verify the link can be retrieved
      const { data: verifyData, error: verifyError } = await supabase
        .from("affiliate_links")
        .select("id, slug, original_url, status")
        .eq("slug", slug)
        .single();

      if (verifyError) {
        console.warn("⚠️ Could not verify link creation:", verifyError);
      } else {
        console.log("✅ VERIFICATION PASSED - Link is retrievable:");
        console.log("   Slug:", verifyData.slug);
        console.log("   Destination:", verifyData.original_url);
        console.log("   Status:", verifyData.status);
      }

      return { 
        success: true, 
        link: data,
        shortUrl: cloakedUrl
      };
    } catch (error: any) {
      console.error("💥 Exception creating affiliate link:", error);
      console.error("💥 Stack trace:", error.stack);
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
   * Get all links for current user
   */
  async getUserLinks() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("No authenticated user - returning empty links");
        return { links: [], error: null };
      }

      console.log("📊 Fetching affiliate links for user:", user.id);

      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching user links:", error);
        // Return empty array instead of throwing - might be RLS or permissions issue
        return { links: [], error: error.message };
      }

      console.log(`✅ Found ${data?.length || 0} affiliate links`);
      return { links: data || [], error: null };
    } catch (err: any) {
      console.error("💥 Exception in getUserLinks:", err);
      return { links: [], error: err.message || "Failed to fetch user links" };
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
    console.log("🖱️ Tracking click for slug:", slug);
    
    try {
      // CRITICAL: Lookup link with detailed logging
      console.log("🔍 Looking up link in database...");
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (linkError) {
        console.error("❌ Database error looking up link:", linkError);
        return { success: false, redirect_url: null, linkId: null };
      }

      if (!link) {
        console.error("❌ Link not found for slug:", slug);
        console.log("🔍 Trying to find ANY link with similar slug...");
        
        // Fallback: Try to find any active link (for debugging)
        const { data: anyLinks } = await supabase
          .from("affiliate_links")
          .select("slug, status")
          .eq("status", "active")
          .limit(5);
        
        console.log("📋 Active links in database:", anyLinks?.map(l => l.slug));
        return { success: false, redirect_url: null, linkId: null };
      }

      console.log("✅ Link found!");
      console.log("   ID:", link.id);
      console.log("   Product:", link.product_name);
      console.log("   Destination:", link.original_url);
      console.log("   Current clicks:", link.clicks);

      // CRITICAL: Validate destination URL
      if (!link.original_url || link.original_url.trim() === "") {
        console.error("❌ Link has no destination URL");
        return { success: false, redirect_url: null, linkId: link.id };
      }

      // Validate URL format
      try {
        const urlTest = new URL(link.original_url);
        console.log("✅ Valid URL format:", urlTest.hostname);
        
        // Check for invalid patterns
        const invalidPatterns = [
          "example.com",
          "placeholder",
          "test.com",
          "localhost",
          "salemakseb.com" // Don't redirect to ourselves
        ];
        
        const isInvalid = invalidPatterns.some(pattern => 
          link.original_url.toLowerCase().includes(pattern)
        );
        
        if (isInvalid) {
          console.error("❌ Invalid URL pattern detected:", link.original_url);
          return { success: false, redirect_url: null, linkId: link.id };
        }
      } catch (urlError) {
        console.error("❌ Invalid URL format:", link.original_url);
        return { success: false, redirect_url: null, linkId: link.id };
      }

      // Record click event
      console.log("📝 Recording click event...");
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
        console.warn("⚠️ Failed to record click event:", clickError);
        // Continue anyway - don't block redirect
      } else {
        console.log("✅ Click event recorded");
      }

      // Update click counter
      console.log("📊 Updating click counter...");
      const newClickCount = (link.clicks || 0) + 1;
      const { error: updateError } = await supabase
        .from("affiliate_links")
        .update({ 
          clicks: newClickCount,
          click_count: newClickCount
        })
        .eq("id", link.id);

      if (updateError) {
        console.warn("⚠️ Failed to update click counter:", updateError);
        // Continue anyway - don't block redirect
      } else {
        console.log(`✅ Click counter updated: ${link.clicks} → ${newClickCount}`);
      }

      console.log("🎯 Redirecting to:", link.original_url);
      return { 
        success: true, 
        redirect_url: link.original_url, 
        linkId: link.id 
      };
    } catch (err: any) {
      console.error("💥 Unexpected error tracking click:", err);
      console.error("💥 Stack trace:", err.stack);
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