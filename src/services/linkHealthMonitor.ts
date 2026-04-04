import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "./smartProductDiscovery";

/**
 * LINK HEALTH MONITOR & AUTO-REPAIR SYSTEM
 * Detects broken links and automatically replaces them
 */

export const linkHealthMonitor = {
  /**
   * ONE-CLICK AUTO-REPAIR
   * Scans all links, removes broken ones, adds fresh products
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
      console.log("🔧 Starting One-Click Auto-Repair...");
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

      console.log(`📊 Checking ${allLinks.length} links...`);

      // Identify broken links (invalid Amazon URLs or missing ASINs)
      const brokenLinks = allLinks.filter(link => {
        const url = link.original_url || "";
        
        // Check if it's a valid Amazon product URL
        const isValidAmazon = url.includes("amazon.com/dp/") || url.includes("amazon.com/gp/");
        const hasASIN = /\/dp\/([A-Z0-9]{10})/.test(url) || /\/gp\/product\/([A-Z0-9]{10})/.test(url);
        
        const isBroken = !isValidAmazon || !hasASIN;
        if (isBroken) {
          console.log("🔴 Broken link detected:", { name: link.product_name, url });
        }
        
        return isBroken;
      });

      console.log(`🔴 Found ${brokenLinks.length} broken links`);

      // Remove broken links
      let removed = 0;
      if (brokenLinks.length > 0) {
        const brokenIds = brokenLinks.map(link => link.id);
        console.log("Attempting to delete links:", brokenIds);
        
        const { error: deleteError } = await supabase
          .from("affiliate_links")
          .delete()
          .in("id", brokenIds);

        console.log("Delete result:", { error: deleteError });

        if (!deleteError) {
          removed = brokenLinks.length;
          console.log(`✅ Removed ${removed} broken links`);
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
      } else {
        console.log("⚠️ Skipping product replacement:", { removed, campaignId });
      }

      const result = {
        success: true,
        totalChecked: allLinks.length,
        removed,
        replaced,
        repaired: replaced
      };
      
      console.log("🎯 Final result:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in oneClickAutoRepair:", error);
      return { success: false, totalChecked: 0, removed: 0, replaced: 0, repaired: 0 };
    }
  },

  /**
   * Get health dashboard data
   */
  async getHealthDashboard(campaignId: string): Promise<{
    totalLinks: number;
    brokenLinks: number;
    healthScore: number;
  }> {
    try {
      const { data: allLinks } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "active");

      if (!allLinks) {
        return { totalLinks: 0, brokenLinks: 0, healthScore: 100 };
      }

      // Check for broken links
      const brokenCount = allLinks.filter(link => {
        const url = link.original_url || "";
        const isValidAmazon = url.includes("amazon.com/dp/") || url.includes("amazon.com/gp/");
        const hasASIN = /\/dp\/([A-Z0-9]{10})/.test(url) || /\/gp\/product\/([A-Z0-9]{10})/.test(url);
        return !isValidAmazon || !hasASIN;
      }).length;

      const healthScore = allLinks.length > 0
        ? Math.round(((allLinks.length - brokenCount) / allLinks.length) * 100)
        : 100;

      return {
        totalLinks: allLinks.length,
        brokenLinks: brokenCount,
        healthScore,
      };
    } catch (error) {
      console.error("Error getting health dashboard:", error);
      return { totalLinks: 0, brokenLinks: 0, healthScore: 0 };
    }
  },

  /**
   * Discover trending products
   */
  async discoverTrendingProducts(count: number = 10) {
    const trending = await smartProductDiscovery.discoverTrending();
    return trending.slice(0, count);
  },

  /**
   * Rotate underperforming products
   */
  async rotateProducts(userId: string, minClicks: number = 10): Promise<{ success: boolean; removed: number; added: number }> {
    try {
      return await smartProductDiscovery.refreshCatalog(userId);
    } catch (error) {
      console.error("Error rotating products:", error);
      return { success: false, removed: 0, added: 0 };
    }
  },
};