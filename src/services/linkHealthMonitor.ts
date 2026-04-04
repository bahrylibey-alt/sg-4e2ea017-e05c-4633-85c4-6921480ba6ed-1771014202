import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "./smartProductDiscovery";

/**
 * LINK HEALTH MONITOR & AUTO-REPAIR SYSTEM
 * Real URL validation with actual HTTP checks
 */
export const linkHealthMonitor = {
  /**
   * Test if a URL actually works by making a real HTTP request
   */
  async testUrl(url: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing URL: ${url}`);
      
      // Make actual HTTP request to check if product exists
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
        }
      });
      
      const isWorking = response.ok && response.status !== 404;
      console.log(`${isWorking ? '✅' : '❌'} URL status: ${response.status}`);
      
      return isWorking;
    } catch (error) {
      console.error(`❌ Failed to test URL ${url}:`, error);
      return false;
    }
  },

  /**
   * ONE-CLICK AUTO-REPAIR
   * Actually tests URLs with HTTP requests and fixes broken links
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
      console.log("🔧 Starting One-Click Auto-Repair with REAL URL testing...");
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

      console.log(`📊 Testing ${allLinks.length} links with REAL HTTP requests...`);

      // Test each link with actual HTTP requests
      const brokenLinks = [];
      
      for (const link of allLinks) {
        const url = link.original_url || "";
        
        // First check if it's a valid Amazon URL format
        const isValidFormat = url.includes("amazon.com/dp/") || url.includes("amazon.com/gp/");
        
        if (!isValidFormat) {
          console.log("🔴 Invalid format:", { name: link.product_name, url });
          brokenLinks.push(link);
          continue;
        }
        
        // Now actually TEST the URL with HTTP request
        console.log(`Testing ${link.product_name}...`);
        const isWorking = await this.testUrl(url);
        
        if (!isWorking) {
          console.log("🔴 Broken link (404/error):", { name: link.product_name, url });
          brokenLinks.push(link);
        } else {
          console.log("✅ Working:", link.product_name);
        }
      }

      console.log(`🔴 Found ${brokenLinks.length} broken/404 links`);

      // Remove broken links
      let removed = 0;
      if (brokenLinks.length > 0) {
        const brokenIds = brokenLinks.map(link => link.id);
        console.log("Deleting broken links:", brokenIds);
        
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
          brokenLinks: 0,
          healthScore: 100
        };
      }

      // Test each link with real HTTP requests
      let brokenCount = 0;
      for (const link of links) {
        const isWorking = await this.testUrl(link.original_url || "");
        if (!isWorking) brokenCount++;
      }

      const healthScore = links.length > 0 
        ? Math.round(((links.length - brokenCount) / links.length) * 100)
        : 100;

      return {
        totalLinks: links.length,
        brokenLinks: brokenCount,
        healthScore
      };
    } catch (error) {
      console.error("Error getting health dashboard:", error);
      return {
        totalLinks: 0,
        brokenLinks: 0,
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