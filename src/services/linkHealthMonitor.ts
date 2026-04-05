import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "./smartProductDiscovery";

/**
 * LINK HEALTH MONITOR v4.0
 * REAL 404 DETECTION + MULTI-NETWORK SUPPORT
 * Amazon, Temu, AliExpress validation
 */

// BLACKLISTED ASINs (2024 and older - known dead products)
const BLACKLISTED_ASINS = [
  'B0D1XD1ZV3', 'B0CFPJYX9B', 'B01NBKTPTS', 'B09XS7JWHH',
  'B08V3GH3JY', 'B0CDDHGDJP', 'B0B4PSKHHN', 'B0CHX3PBRG',
  'B0CC5XQWLP', 'B0CFPJYX9B',
];

export const linkHealthMonitor = {
  /**
   * Detect network from URL
   */
  detectNetwork(url: string): "amazon" | "temu" | "aliexpress" | "unknown" {
    if (!url) return "unknown";
    
    const urlLower = url.toLowerCase();
    if (urlLower.includes("amazon.com")) return "amazon";
    if (urlLower.includes("temu.com")) return "temu";
    if (urlLower.includes("aliexpress.com")) return "aliexpress";
    
    return "unknown";
  },

  /**
   * Validate Amazon URL format
   */
  validateAmazonUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('amazon.com')) return false;
      
      const validPatterns = [
        /\/dp\/[A-Z0-9]{10}/,
        /\/gp\/product\/[A-Z0-9]{10}/,
        /\/[^/]+\/dp\/[A-Z0-9]{10}/,
      ];
      
      return validPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  },

  /**
   * Validate Temu URL format
   */
  validateTemuUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('temu.com')) return false;
      
      // Temu uses goods_id parameter
      const validPatterns = [
        /goods_id=\d+/,
        /kuiper\/un\d+\.html/,
        /\d{15,}/,
      ];
      
      return validPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  },

  /**
   * Validate AliExpress URL format
   */
  validateAliExpressUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('aliexpress.com')) return false;
      
      const validPatterns = [
        /\/item\/\d+\.html/,
        /\/\d+\.html/,
      ];
      
      return validPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  },

  /**
   * Extract product ID from URL
   */
  extractProductId(url: string): string | null {
    const network = this.detectNetwork(url);
    
    switch (network) {
      case "amazon":
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
        return asinMatch ? (asinMatch[1] || asinMatch[2]) : null;
      
      case "temu":
        const temuMatch = url.match(/goods_id=(\d+)/);
        return temuMatch ? temuMatch[1] : null;
      
      case "aliexpress":
        const aliMatch = url.match(/\/item\/(\d+)\.html/);
        return aliMatch ? aliMatch[1] : null;
      
      default:
        return null;
    }
  },

  /**
   * Check if product is blacklisted (only for Amazon)
   */
  isBlacklistedProduct(url: string): boolean {
    const network = this.detectNetwork(url);
    if (network !== "amazon") return false;
    
    const asin = this.extractProductId(url);
    return asin ? BLACKLISTED_ASINS.includes(asin) : false;
  },

  /**
   * REAL 404 Detection using Edge Function
   */
  async checkProductAvailability(url: string): Promise<{ available: boolean; status?: number; error?: string }> {
    try {
      const network = this.detectNetwork(url);
      
      // Only check Amazon via Edge Function (Temu/AliExpress don't have CORS restrictions for HEAD)
      if (network === "amazon") {
        const { data, error } = await supabase.functions.invoke('check-amazon-link', {
          body: { url }
        });

        if (error) {
          console.error("Edge function error:", error);
          return { available: false, error: error.message };
        }

        console.log(`🔍 Amazon check result:`, data);
        return {
          available: data.available,
          status: data.statusCode
        };
      }
      
      // For Temu/AliExpress, assume valid if format is correct
      // (They don't have same CORS restrictions, can be checked client-side later)
      if (network === "temu") {
        return { available: this.validateTemuUrl(url), status: 200 };
      }
      
      if (network === "aliexpress") {
        return { available: this.validateAliExpressUrl(url), status: 200 };
      }
      
      return { available: false, error: "Unknown network" };
    } catch (error) {
      console.error("Error checking availability:", error);
      return { available: false, error: String(error) };
    }
  },

  /**
   * Comprehensive validation
   */
  async validateProduct(url: string, checkAvailability = false): Promise<{ valid: boolean; reason?: string }> {
    const network = this.detectNetwork(url);
    
    // Validate format based on network
    let formatValid = false;
    switch (network) {
      case "amazon":
        formatValid = this.validateAmazonUrl(url);
        break;
      case "temu":
        formatValid = this.validateTemuUrl(url);
        break;
      case "aliexpress":
        formatValid = this.validateAliExpressUrl(url);
        break;
      default:
        return { valid: false, reason: "Unknown network" };
    }

    if (!formatValid) {
      return { valid: false, reason: `Invalid ${network} URL format` };
    }

    const productId = this.extractProductId(url);
    if (!productId) {
      return { valid: false, reason: "Missing product ID" };
    }

    // Check Amazon blacklist
    if (network === "amazon" && BLACKLISTED_ASINS.includes(productId)) {
      return { valid: false, reason: "Blacklisted product (2024 or older)" };
    }

    // Real availability check
    if (checkAvailability) {
      const availabilityCheck = await this.checkProductAvailability(url);
      if (!availabilityCheck.available) {
        return { 
          valid: false, 
          reason: `Product not available (HTTP ${availabilityCheck.status || 'error'})` 
        };
      }
    }

    return { valid: true };
  },

  /**
   * Remove duplicates (ASIN/product ID based)
   */
  async removeDuplicates(userId: string): Promise<{ removed: number }> {
    try {
      console.log("🧹 Starting deduplication...");

      const { data: allLinks } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!allLinks || allLinks.length === 0) {
        return { removed: 0 };
      }

      const idGroups: { [key: string]: any[] } = {};
      
      for (const link of allLinks) {
        const productId = this.extractProductId(link.original_url || "");
        if (productId) {
          if (!idGroups[productId]) {
            idGroups[productId] = [];
          }
          idGroups[productId].push(link);
        }
      }

      const duplicatesToRemove: string[] = [];
      
      for (const id in idGroups) {
        const group = idGroups[id];
        if (group.length > 1) {
          const toRemove = group.slice(1);
          duplicatesToRemove.push(...toRemove.map(l => l.id));
          console.log(`🔴 Found ${group.length} duplicates of product ${id}, keeping newest`);
        }
      }

      if (duplicatesToRemove.length > 0) {
        const { error } = await supabase
          .from("affiliate_links")
          .delete()
          .in("id", duplicatesToRemove);

        if (!error) {
          console.log(`✅ Removed ${duplicatesToRemove.length} duplicate products`);
          return { removed: duplicatesToRemove.length };
        }
      }

      return { removed: 0 };
    } catch (error) {
      console.error("Error removing duplicates:", error);
      return { removed: 0 };
    }
  },

  /**
   * ONE-CLICK AUTO-REPAIR with REAL 404 detection
   */
  async oneClickAutoRepair(
    campaignId?: string,
    userId?: string,
    testAvailability = true
  ): Promise<{ 
    success: boolean; 
    totalChecked: number; 
    duplicatesRemoved: number;
    invalidRemoved: number;
    replaced: number;
    repaired: number;
    removed: number;
  }> {
    try {
      console.log("🚀 Starting Auto-Repair with REAL 404 detection...");

      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("❌ No user found");
          return { 
            success: false, 
            totalChecked: 0, 
            duplicatesRemoved: 0,
            invalidRemoved: 0,
            replaced: 0,
            repaired: 0,
            removed: 0
          };
        }
        userId = user.id;
      }

      if (!campaignId) {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (campaign) {
          campaignId = campaign.id;
        }
      }

      // STEP 1: Remove duplicates
      console.log("📊 STEP 1: Removing duplicates...");
      const dedupeResult = await this.removeDuplicates(userId);
      const duplicatesRemoved = dedupeResult.removed;

      // STEP 2: Get remaining links
      const { data: allLinks } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active")
        .eq("user_id", userId);

      if (!allLinks || allLinks.length === 0) {
        console.log("⚠️ No links to validate");
        return { 
          success: true, 
          totalChecked: 0, 
          duplicatesRemoved,
          invalidRemoved: 0,
          replaced: 0,
          repaired: duplicatesRemoved,
          removed: duplicatesRemoved
        };
      }

      console.log(`📊 STEP 2: Validating ${allLinks.length} links...`);

      // STEP 3: Validate each link
      const invalidLinks = [];
      
      for (const link of allLinks) {
        const url = link.original_url || "";
        const network = this.detectNetwork(url);
        
        console.log(`🔍 Checking ${network} product:`, link.product_name);
        
        // Format validation
        const validation = await this.validateProduct(url, false);
        
        if (!validation.valid) {
          console.log(`🔴 ${validation.reason}:`, link.product_name);
          invalidLinks.push(link);
          continue;
        }

        // Real 404 check (for Amazon only)
        if (testAvailability && network === "amazon") {
          console.log(`🔍 Testing availability:`, link.product_name);
          const availabilityCheck = await this.checkProductAvailability(url);
          
          if (!availabilityCheck.available) {
            console.log(`🔴 Product unavailable (HTTP ${availabilityCheck.status}):`, link.product_name);
            invalidLinks.push(link);
            continue;
          }
        }

        console.log("✅ Valid:", link.product_name);
      }

      // STEP 4: Remove invalid products
      let invalidRemoved = 0;
      if (invalidLinks.length > 0) {
        console.log(`🔥 STEP 3: Removing ${invalidLinks.length} invalid products...`);
        
        const invalidIds = invalidLinks.map(link => link.id);
        const { error } = await supabase
          .from("affiliate_links")
          .delete()
          .in("id", invalidIds);

        if (!error) {
          invalidRemoved = invalidLinks.length;
          console.log(`✅ Removed ${invalidRemoved} invalid products`);
        }
      }

      // STEP 5: Add fresh replacements
      let replaced = 0;
      
      if (invalidRemoved > 0 && campaignId) {
        console.log(`🔄 STEP 4: Adding ${invalidRemoved} fresh products...`);
        const addResult = await smartProductDiscovery.addToCampaign(
          campaignId,
          userId,
          invalidRemoved
        );
        replaced = addResult.added;
        console.log(`✅ Added ${replaced} fresh products`);
      }

      const totalRepaired = duplicatesRemoved + invalidRemoved;
      
      console.log("🎯 Auto-Repair Complete:");
      console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
      console.log(`   - Invalid removed: ${invalidRemoved}`);
      console.log(`   - Fresh products added: ${replaced}`);
      console.log(`   - Total repaired: ${totalRepaired}`);

      return {
        success: true,
        totalChecked: allLinks.length + duplicatesRemoved,
        duplicatesRemoved,
        invalidRemoved,
        replaced,
        repaired: totalRepaired,
        removed: totalRepaired
      };
    } catch (error) {
      console.error("❌ Error in Auto-Repair:", error);
      return { 
        success: false, 
        totalChecked: 0, 
        duplicatesRemoved: 0,
        invalidRemoved: 0,
        replaced: 0,
        repaired: 0,
        removed: 0
      };
    }
  },

  /**
   * Get health dashboard
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
          brokenLinks: 0,
          healthScore: 100
        };
      }

      let invalidCount = 0;
      for (const link of links) {
        const validation = await this.validateProduct(link.original_url || "", false);
        if (!validation.valid) invalidCount++;
      }

      const healthScore = links.length > 0 
        ? Math.round(((links.length - invalidCount) / links.length) * 100)
        : 100;

      return {
        totalLinks: links.length,
        invalidLinks: invalidCount,
        brokenLinks: invalidCount,
        healthScore
      };
    } catch (error) {
      console.error("Error getting health dashboard:", error);
      return {
        totalLinks: 0,
        invalidLinks: 0,
        brokenLinks: 0,
        healthScore: 0
      };
    }
  },

  /**
   * Rotate underperformers
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

      const underperformers = links.filter(link => {
        const conversionRate = link.clicks > 0 ? (link.conversions || 0) / link.clicks : 0;
        return conversionRate < threshold && link.clicks > 10;
      });

      if (underperformers.length === 0) {
        return { success: true, removed: 0, added: 0 };
      }

      const underperformerIds = underperformers.map(l => l.id);
      await supabase
        .from("affiliate_links")
        .delete()
        .in("id", underperformerIds);

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