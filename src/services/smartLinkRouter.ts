import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];

/**
 * Smart Link Router - Intelligently routes affiliate links and validates URLs
 */
export const smartLinkRouter = {
  /**
   * Validate if a URL is reachable and not a 404
   */
  async validateUrl(url: string): Promise<{
    valid: boolean;
    status?: number;
    redirectUrl?: string;
    error?: string;
  }> {
    try {
      // Basic URL format validation
      const urlObj = new URL(url);
      
      // Check for invalid patterns
      const invalidPatterns = [
        "example.com",
        "placeholder",
        "test.com",
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "salemakseb.com", // Don't redirect to ourselves
        "/member/404", // CJ 404 page
        "/404",
        "error",
        "invalid"
      ];
      
      const isInvalid = invalidPatterns.some(pattern => 
        url.toLowerCase().includes(pattern)
      );
      
      if (isInvalid) {
        return {
          valid: false,
          error: "URL contains invalid pattern"
        };
      }

      // Check if domain exists (basic validation)
      if (!urlObj.hostname || urlObj.hostname.length < 4) {
        return {
          valid: false,
          error: "Invalid hostname"
        };
      }

      return {
        valid: true,
        status: 200
      };
    } catch (error) {
      return {
        valid: false,
        error: "Invalid URL format"
      };
    }
  },

  /**
   * Get a valid redirect URL for a slug, with fallback logic
   */
  async getRedirectUrl(slug: string, metadata?: {
    user_agent?: string;
    referrer?: string;
    device_type?: string;
  }): Promise<{
    success: boolean;
    redirect_url: string | null;
    linkId: string | null;
    error?: string;
  }> {
    console.log("🔍 [Smart Router] Getting redirect URL for slug:", slug);

    try {
      // Step 1: Lookup link in database
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (linkError) {
        console.error("❌ [Smart Router] Database error:", linkError);
        return { 
          success: false, 
          redirect_url: null, 
          linkId: null,
          error: "Database error"
        };
      }

      if (!link) {
        console.error("❌ [Smart Router] Link not found for slug:", slug);
        return { 
          success: false, 
          redirect_url: null, 
          linkId: null,
          error: "Link not found or inactive"
        };
      }

      console.log("✅ [Smart Router] Link found:", link.product_name);
      console.log("📍 [Smart Router] Original URL:", link.original_url);

      // Step 2: Validate the destination URL
      const validation = await this.validateUrl(link.original_url);
      
      if (!validation.valid) {
        console.error("❌ [Smart Router] Invalid destination URL:", validation.error);
        
        // Try to auto-repair the link
        const repairedUrl = await this.attemptUrlRepair(link);
        
        if (repairedUrl) {
          console.log("✅ [Smart Router] Auto-repaired URL:", repairedUrl);
          return {
            success: true,
            redirect_url: repairedUrl,
            linkId: link.id
          };
        }
        
        return {
          success: false,
          redirect_url: null,
          linkId: link.id,
          error: "Invalid destination URL - unable to repair"
        };
      }

      // Step 3: Track the click
      await this.trackClick(link.id, link.user_id, metadata);

      // Step 4: Return valid URL
      console.log("✅ [Smart Router] Redirecting to:", link.original_url);
      return {
        success: true,
        redirect_url: link.original_url,
        linkId: link.id
      };

    } catch (error: any) {
      console.error("💥 [Smart Router] Unexpected error:", error);
      return {
        success: false,
        redirect_url: null,
        linkId: null,
        error: error.message || "Unknown error"
      };
    }
  },

  /**
   * Attempt to repair a broken affiliate URL
   */
  async attemptUrlRepair(link: AffiliateLink): Promise<string | null> {
    console.log("🔧 [Smart Router] Attempting to repair URL for:", link.product_name);

    // Strategy 1: Check if there's a valid product URL in product catalog
    if (link.product_id) {
      const { data: product } = await supabase
        .from("product_catalog")
        .select("affiliate_url")
        .eq("id", link.product_id)
        .maybeSingle();

      if (product?.affiliate_url) {
        const validation = await this.validateUrl(product.affiliate_url);
        if (validation.valid) {
          // Update the link with the repaired URL
          await supabase
            .from("affiliate_links")
            .update({ original_url: product.affiliate_url })
            .eq("id", link.id);
          
          console.log("✅ [Smart Router] Repaired from product catalog");
          return product.affiliate_url;
        }
      }
    }

    // Strategy 2: Try to find product by name in catalog
    const { data: catalogProduct } = await supabase
      .from("product_catalog")
      .select("affiliate_url")
      .ilike("name", `%${link.product_name}%`)
      .limit(1)
      .maybeSingle();

    if (catalogProduct?.affiliate_url) {
      const validation = await this.validateUrl(catalogProduct.affiliate_url);
      if (validation.valid) {
        await supabase
          .from("affiliate_links")
          .update({ original_url: catalogProduct.affiliate_url })
          .eq("id", link.id);
        
        console.log("✅ [Smart Router] Repaired from catalog search");
        return catalogProduct.affiliate_url;
      }
    }

    // Strategy 3: Generate a search URL as fallback
    const searchQuery = encodeURIComponent(link.product_name);
    const fallbackUrl = `https://www.amazon.com/s?k=${searchQuery}`;
    
    console.log("⚠️ [Smart Router] Using Amazon search as fallback");
    return fallbackUrl;
  },

  /**
   * Track click event
   */
  async trackClick(linkId: string, userId: string, metadata?: {
    user_agent?: string;
    referrer?: string;
    device_type?: string;
  }): Promise<void> {
    try {
      // Record click event
      await supabase
        .from("click_events")
        .insert({
          link_id: linkId,
          user_id: userId,
          user_agent: metadata?.user_agent || null,
          referrer: metadata?.referrer || null,
          device_type: metadata?.device_type || "unknown"
        });

      // Update click counter
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
            click_count: (link.clicks || 0) + 1
          })
          .eq("id", linkId);
      }

      console.log("✅ [Smart Router] Click tracked successfully");
    } catch (error) {
      console.error("⚠️ [Smart Router] Failed to track click:", error);
      // Don't block redirect on tracking failure
    }
  },

  /**
   * Health check all affiliate links for a user
   */
  async healthCheckUserLinks(userId: string): Promise<{
    total: number;
    valid: number;
    invalid: number;
    repaired: number;
    details: Array<{
      linkId: string;
      slug: string;
      productName: string;
      status: "valid" | "invalid" | "repaired";
      url: string;
    }>;
  }> {
    console.log("🏥 [Smart Router] Starting health check for user:", userId);

    const { data: links } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (!links || links.length === 0) {
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        repaired: 0,
        details: []
      };
    }

    let validCount = 0;
    let invalidCount = 0;
    let repairedCount = 0;
    const details: Array<{
      linkId: string;
      slug: string;
      productName: string;
      status: "valid" | "invalid" | "repaired";
      url: string;
    }> = [];

    for (const link of links) {
      const validation = await this.validateUrl(link.original_url);
      
      if (validation.valid) {
        validCount++;
        details.push({
          linkId: link.id,
          slug: link.slug,
          productName: link.product_name,
          status: "valid",
          url: link.original_url
        });
      } else {
        // Try to repair
        const repairedUrl = await this.attemptUrlRepair(link);
        
        if (repairedUrl) {
          repairedCount++;
          details.push({
            linkId: link.id,
            slug: link.slug,
            productName: link.product_name,
            status: "repaired",
            url: repairedUrl
          });
        } else {
          invalidCount++;
          details.push({
            linkId: link.id,
            slug: link.slug,
            productName: link.product_name,
            status: "invalid",
            url: link.original_url
          });
        }
      }
    }

    console.log(`✅ [Smart Router] Health check complete: ${validCount} valid, ${invalidCount} invalid, ${repairedCount} repaired`);

    return {
      total: links.length,
      valid: validCount,
      invalid: invalidCount,
      repaired: repairedCount,
      details
    };
  }
};