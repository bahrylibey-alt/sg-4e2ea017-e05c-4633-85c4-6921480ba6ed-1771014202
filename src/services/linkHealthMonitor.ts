import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "./smartProductDiscovery";

/**
 * LINK HEALTH MONITOR & AUTO-REPAIR SYSTEM
 * Format-based validation (CORS-safe for browser)
 */
export const linkHealthMonitor = {
  /**
   * Validate Amazon URL format (CORS-safe, no HTTP requests)
   */
  validateAmazonUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      
      // Check if it's an Amazon domain
      if (!urlObj.hostname.includes('amazon.com')) return false;
      
      // Check for valid Amazon product URL patterns
      const validPatterns = [
        /\/dp\/[A-Z0-9]{10}/,  // Standard: /dp/B0CC5XQWLP
        /\/gp\/product\/[A-Z0-9]{10}/, // Alternative: /gp/product/B0CC5XQWLP
        /\/[^/]+\/dp\/[A-Z0-9]{10}/, // With category: /Electronics/dp/B0CC5XQWLP
      ];
      
      return validPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  },

  /**
   * Extract ASIN from Amazon URL
   */
  extractAsin(url: string): string | null {
    const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    return match ? (match[1] || match[2]) : null;
  },

  /**
   * ONE-CLICK AUTO-REPAIR
   * Validates Amazon URL formats and removes invalid links
   */
  async oneClickAutoRepair(
    campaignId?: string,
    userId?: string
  ): Promise<{ 
    success: boolean; 
    totalChecked: number; 
    removed: number; 
    replaced: number;
    repaired: number;
  }> {
    try {
      console.log("🔧 Starting One-Click Auto-Repair with format validation...");
      console.log("Input parameters:", { campaignId, userId });

      // Get user ID if not provided
      if (!userId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("Auth check:", { user: user?.id, error: userError });
        
        if (!user) {
          console.error("❌ No user found - cannot proceed");
          return { success: false, totalChecked: 0, removed: 0, replaced: 0, repaired: 0 };
        }
        userId = user.id;
      }

      console.log("✅ Using user ID:", userId);

      // Get campaign ID if not provided
      if (!campaignId) {
        const { data: campaign, error: campaignError } = await supabase
          .from("campaigns")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        console.log("Campaign lookup:", { campaign: campaign?.id, error: campaignError });

        if (campaign) {
          campaignId = campaign.id;
        }
      }

      console.log("✅ Using campaign ID:", campaignId);

      // Get all active links
      const { data: allLinks, error: linksError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active")
        .eq("user_id", userId);

      console.log("Links query:", { count: allLinks?.length, error: linksError });

      if (!allLinks || allLinks.length === 0) {
        console.log("⚠️ No links to check");
        return { success: true, totalChecked: 0, removed: 0, replaced: 0, repaired: 0 };
      }

      console.log(`📊 Validating ${allLinks.length} links (format check)...`);

      // Validate each link format
      const invalidLinks = [];
      
      for (const link of allLinks) {
        const url = link.original_url || "";
        
        // Validate Amazon URL format
        const isValid = this.validateAmazonUrl(url);
        const asin = this.extractAsin(url);
        
        if (!isValid || !asin) {
          console.log("🔴 Invalid format:", { 
            name: link.product_name, 
            url,
            hasAsin: !!asin 
          });
          invalidLinks.push(link);
        } else {
          console.log("✅ Valid:", link.product_name);
        }
      }

      console.log(`🔴 Found ${invalidLinks.length} invalid links`);

      // Remove invalid links
      let removed = 0;
      if (invalidLinks.length > 0) {
        const invalidIds = invalidLinks.map(link => link.id);
        console.log("Deleting invalid links:", invalidIds);
        
        const { error: deleteError } = await supabase
          .from("affiliate_links")
          .delete()
          .in("id", invalidIds);

        console.log("Delete result:", { error: deleteError });

        if (!deleteError) {
          removed = invalidLinks.length;
          console.log(`✅ Removed ${removed} invalid links`);
        } else {
          console.error("❌ Failed to remove links:", deleteError);
        }
      }

      // Add replacement products
      let replaced = 0;
      if (removed > 0 && campaignId) {
        console.log(`🔄 Adding ${removed} replacement products...`);
        const addResult = await smartProductDiscovery.addToCampaign(
          campaignId,
          userId,
          removed
        );
        console.log("Add products result:", addResult);
        replaced = addResult.added;
        console.log(`✅ Added ${replaced} fresh products`);
      }

      const result = {
        success: true,
        totalChecked: allLinks.length,
        removed,
        replaced,
        repaired: replaced
      };
      
      console.log("🎯 Final Auto-Repair result:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in oneClickAutoRepair:", error);
      return { success: false, totalChecked: 0, removed: 0, replaced: 0, repaired: 0 };
    }
  },

  /**
   * Get health dashboard metrics
   */
  async getHealthDashboard(campaignId: string) {
    try {
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "active");

      if (!links) {
        return {
          totalLinks: 0,
          invalidLinks: 0,
          healthScore: 100
        };
      }

      // Validate each link format
      let invalidCount = 0;
      for (const link of links) {
        const isValid = this.validateAmazonUrl(link.original_url || "");
        if (!isValid) invalidCount++;
      }

      const healthScore = links.length > 0 
        ? Math.round(((links.length - invalidCount) / links.length) * 100)
        : 100;

      return {
        totalLinks: links.length,
        invalidLinks: invalidCount,
        healthScore
      };
    } catch (error) {
      console.error("Error getting health dashboard:", error);
      return {
        totalLinks: 0,
        invalidLinks: 0,
        healthScore: 0
      };
    }
  },

  /**
   * Rotate underperforming products
   */
  async rotateUnderperformers(campaignId: string, userId: string, threshold: number = 0.5) {
    try {
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "active");

      if (!links || links.length === 0) {
        return { success: false, removed: 0, added: 0 };
      }

      // Find underperformers
      const underperformers = links.filter(link => {
        const conversionRate = link.clicks > 0 ? (link.conversions || 0) / link.clicks : 0;
        return conversionRate < threshold && link.clicks > 10;
      });

      if (underperformers.length === 0) {
        return { success: true, removed: 0, added: 0 };
      }

      // Remove underperformers
      const underperformerIds = underperformers.map(l => l.id);
      await supabase
        .from("affiliate_links")
        .delete()
        .in("id", underperformerIds);

      // Add fresh products
      const addResult = await smartProductDiscovery.addToCampaign(
        campaignId,
        userId,
        underperformers.length
      );

      return {
        success: true,
        removed: underperformers.length,
        added: addResult.added
      };
    } catch (error) {
      console.error("Error rotating products:", error);
      return { success: false, removed: 0, added: 0 };
    }
  },
};