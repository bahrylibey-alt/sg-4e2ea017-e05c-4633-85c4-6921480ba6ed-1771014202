import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { linkHealthMonitor } from "./linkHealthMonitor";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];

/**
 * SMART LINK ROUTER v2.0 - PRODUCTION READY
 * ✅ Format validation (no HTTP to avoid CAPTCHA)
 * ✅ Real-time failure tracking
 * ✅ Intelligent repair using catalog
 * ✅ Smart fallbacks
 */
export const smartLinkRouter = {
  /**
   * Get redirect URL with smart routing
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
    console.log("🔍 [Smart Router] Processing slug:", slug);

    try {
      // Step 1: Lookup link
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (linkError) {
        console.error("❌ Database error:", linkError);
        return { 
          success: false, 
          redirect_url: null, 
          linkId: null,
          error: "Database error"
        };
      }

      if (!link) {
        console.error("❌ Link not found:", slug);
        return { 
          success: false, 
          redirect_url: null, 
          linkId: null,
          error: "Link not found"
        };
      }

      console.log("✅ Link found:", link.product_name);

      // Step 2: Validate format (no HTTP)
      const validation = await linkHealthMonitor.validateProduct(link.original_url);
      
      if (!validation.valid) {
        console.error("❌ Invalid URL format:", validation.reason);
        
        // Track failure
        await linkHealthMonitor.trackClickFailure(link.id);
        
        // Try to repair
        const repairResult = await linkHealthMonitor.repairLink(link.id);
        
        if (repairResult.repaired && repairResult.newUrl) {
          console.log("✅ Auto-repaired:", repairResult.newUrl);
          await this.trackClick(link.id, link.user_id, metadata);
          return {
            success: true,
            redirect_url: repairResult.newUrl,
            linkId: link.id
          };
        }
        
        // Fallback to search
        const fallbackUrl = this.generateFallbackUrl(link);
        console.log("⚠️ Using fallback:", fallbackUrl);
        return {
          success: true,
          redirect_url: fallbackUrl,
          linkId: link.id
        };
      }

      // Step 3: Track click
      await this.trackClick(link.id, link.user_id, metadata);

      // Step 4: Return URL
      console.log("✅ Redirecting to:", link.original_url);
      return {
        success: true,
        redirect_url: link.original_url,
        linkId: link.id
      };

    } catch (error: any) {
      console.error("💥 Unexpected error:", error);
      return {
        success: false,
        redirect_url: null,
        linkId: null,
        error: error.message || "Unknown error"
      };
    }
  },

  /**
   * Generate fallback URL (search instead of broken link)
   */
  generateFallbackUrl(link: AffiliateLink): string {
    const network = linkHealthMonitor.detectNetwork(link.original_url || "");
    const searchQuery = encodeURIComponent(link.product_name || "");
    
    switch (network) {
      case "amazon":
        return `https://www.amazon.com/s?k=${searchQuery}`;
      case "temu":
        return `https://www.temu.com/search_result.html?search_key=${searchQuery}`;
      case "aliexpress":
        return `https://www.aliexpress.com/wholesale?SearchText=${searchQuery}`;
      default:
        return `https://www.google.com/search?q=${searchQuery}`;
    }
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

      // Update counters
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("clicks, click_count")
        .eq("id", linkId)
        .single();

      if (link) {
        await supabase
          .from("affiliate_links")
          .update({ 
            clicks: (link.clicks || 0) + 1,
            click_count: (link.click_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", linkId);
      }

      console.log("✅ Click tracked");
    } catch (error) {
      console.error("⚠️ Failed to track click:", error);
    }
  },

  /**
   * Batch validate links
   */
  async batchValidateLinks(linkIds: string[]): Promise<{
    total: number;
    valid: number;
    invalid: number;
    results: Array<{
      linkId: string;
      valid: boolean;
      reason?: string;
      confidence: string;
    }>;
  }> {
    const results = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const linkId of linkIds) {
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("original_url")
        .eq("id", linkId)
        .single();

      if (link) {
        const validation = await linkHealthMonitor.validateProduct(link.original_url || "");
        
        results.push({
          linkId,
          valid: validation.valid,
          reason: validation.reason,
          confidence: validation.confidence
        });

        if (validation.valid) validCount++;
        else invalidCount++;
      }
    }

    return {
      total: linkIds.length,
      valid: validCount,
      invalid: invalidCount,
      results
    };
  },

  /**
   * Health check campaign links
   */
  async healthCheckCampaign(campaignId: string): Promise<{
    total: number;
    valid: number;
    invalid: number;
    repaired: number;
    details: Array<{
      linkId: string;
      slug: string;
      productName: string;
      status: "valid" | "invalid" | "repaired";
      network: string;
    }>;
  }> {
    console.log("🏥 Health checking campaign:", campaignId);

    const { data: links } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("status", "active");

    if (!links || links.length === 0) {
      return { total: 0, valid: 0, invalid: 0, repaired: 0, details: [] };
    }

    let validCount = 0;
    let invalidCount = 0;
    let repairedCount = 0;
    const details = [];

    for (const link of links) {
      const validation = await linkHealthMonitor.validateProduct(link.original_url || "");
      const network = linkHealthMonitor.detectNetwork(link.original_url || "");
      
      if (validation.valid) {
        validCount++;
        details.push({
          linkId: link.id,
          slug: link.slug,
          productName: link.product_name,
          status: "valid" as const,
          network
        });
      } else {
        const repairResult = await linkHealthMonitor.repairLink(link.id);
        
        if (repairResult.repaired) {
          repairedCount++;
          details.push({
            linkId: link.id,
            slug: link.slug,
            productName: link.product_name,
            status: "repaired" as const,
            network
          });
        } else {
          invalidCount++;
          details.push({
            linkId: link.id,
            slug: link.slug,
            productName: link.product_name,
            status: "invalid" as const,
            network
          });
        }
      }
    }

    console.log(`✅ Health check complete: ${validCount} valid, ${invalidCount} invalid, ${repairedCount} repaired`);

    return {
      total: links.length,
      valid: validCount,
      invalid: invalidCount,
      repaired: repairedCount,
      details
    };
  }
};