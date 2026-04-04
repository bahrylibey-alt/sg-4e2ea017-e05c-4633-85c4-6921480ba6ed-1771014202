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

      // Get user ID if not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No user found");
          return { success: false, totalChecked: 0, removed: 0, replaced: 0, repaired: 0 };
        }
        userId = user.id;
      }

      // Get campaign ID if not provided
      if (!campaignId) {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (campaign) {
          campaignId = campaign.id;
        }
      }

      // Get all active links
      const { data: allLinks } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active")
        .eq("user_id", userId);

      if (!allLinks || allLinks.length === 0) {
        console.log("No links to check");
        return { success: true, totalChecked: 0, removed: 0, replaced: 0, repaired: 0 };
      }

      console.log(`📊 Checking ${allLinks.length} links...`);

      // Identify broken links (invalid Amazon URLs or missing ASINs)
      const brokenLinks = allLinks.filter(link => {
        const url = link.original_url || "";
        
        // Check if it's a valid Amazon product URL
        const isValidAmazon = url.includes("amazon.com/dp/") || url.includes("amazon.com/gp/");
        const hasASIN = /\/dp\/([A-Z0-9]{10})/.test(url) || /\/gp\/product\/([A-Z0-9]{10})/.test(url);
        
        return !isValidAmazon || !hasASIN;
      });

      console.log(`🔴 Found ${brokenLinks.length} broken links`);

      // Remove broken links
      let removed = 0;
      if (brokenLinks.length > 0) {
        const brokenIds = brokenLinks.map(link => link.id);
        const { error } = await supabase
          .from("affiliate_links")
          .delete()
          .in("id", brokenIds);

        if (!error) {
          removed = brokenLinks.length;
          console.log(`✅ Removed ${removed} broken links`);
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
        replaced = addResult.added;
        console.log(`✅ Added ${replaced} fresh products`);
      }

      return {
        success: true,
        totalChecked: allLinks.length,
        removed,
        replaced,
        repaired: replaced
      };
    } catch (error) {
      console.error("Error in oneClickAutoRepair:", error);
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