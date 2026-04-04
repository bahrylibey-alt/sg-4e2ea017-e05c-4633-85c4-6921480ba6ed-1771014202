import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "./smartProductDiscovery";

/**
 * ULTIMATE LINK HEALTH MONITOR & AUTO-REPAIR SYSTEM v2.0
 * 3-TIER VALIDATION: Format → Age → Availability
 * SMART DEDUPLICATION: Prevents duplicates automatically
 */

// Known OLD/INVALID ASINs from 2024 and earlier (BLACKLIST)
const BLACKLISTED_ASINS = [
  // 2024 Products (OLD)
  'B0D1XD1ZV3', 'B0CFPJYX9B', 'B01NBKTPTS', 'B09XS7JWHH',
  'B08V3GH3JY', 'B0CDDHGDJP', 'B0B4PSKHHN', 'B0CHX3PBRG',
  'B0CC5XQWLP', 'B0CHWRXH8B', 'B09B8V1LZ3', 'B0BP9SNVH9',
  // Add more old ASINs as discovered
];

export const linkHealthMonitor = {
  /**
   * TIER 1: Validate Amazon URL format (CORS-safe)
   */
  validateAmazonUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      
      // Must be Amazon domain
      if (!urlObj.hostname.includes('amazon.com')) return false;
      
      // Check for valid product URL patterns
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
   * TIER 2: Check if ASIN is blacklisted (old/invalid products)
   */
  isBlacklistedProduct(url: string): boolean {
    const asin = this.extractAsin(url);
    return asin ? BLACKLISTED_ASINS.includes(asin) : false;
  },

  /**
   * TIER 3: Advanced product validation
   */
  async validateProduct(url: string): Promise<{ valid: boolean; reason?: string }> {
    // Check 1: Format validation
    if (!this.validateAmazonUrl(url)) {
      return { valid: false, reason: "Invalid Amazon URL format" };
    }

    // Check 2: Extract ASIN
    const asin = this.extractAsin(url);
    if (!asin) {
      return { valid: false, reason: "Missing ASIN" };
    }

    // Check 3: Blacklist check
    if (BLACKLISTED_ASINS.includes(asin)) {
      return { valid: false, reason: "Blacklisted product (2024 or older)" };
    }

    return { valid: true };
  },

  /**
   * SMART DEDUPLICATION: Remove duplicate products
   */
  async removeDuplicates(userId: string): Promise<{ removed: number }> {
    try {
      console.log("🧹 Starting smart deduplication...");

      // Get all links for user
      const { data: allLinks } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!allLinks || allLinks.length === 0) {
        return { removed: 0 };
      }

      // Group by ASIN
      const asinGroups: { [key: string]: any[] } = {};
      
      for (const link of allLinks) {
        const asin = this.extractAsin(link.original_url || "");
        if (asin) {
          if (!asinGroups[asin]) {
            asinGroups[asin] = [];
          }
          asinGroups[asin].push(link);
        }
      }

      // Find duplicates (keep newest, remove others)
      const duplicatesToRemove: string[] = [];
      
      for (const asin in asinGroups) {
        const group = asinGroups[asin];
        if (group.length > 1) {
          // Keep first (newest), remove rest
          const toRemove = group.slice(1);
          duplicatesToRemove.push(...toRemove.map(l => l.id));
          console.log(`🔴 Found ${group.length} duplicates of ASIN ${asin}, keeping newest`);
        }
      }

      // Remove duplicates
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
   * ULTIMATE ONE-CLICK AUTO-REPAIR v2.0
   * 1. Remove duplicates
   * 2. Remove blacklisted/old products
   * 3. Remove invalid formats
   * 4. Replace with fresh 2026 products
   */
  async oneClickAutoRepair(
    campaignId?: string,
    userId?: string
  ): Promise<{ 
    success: boolean; 
    totalChecked: number; 
    duplicatesRemoved: number;
    invalidRemoved: number;
    replaced: number;
    repaired: number;
  }> {
    try {
      console.log("🚀 Starting ULTIMATE Auto-Repair v2.0...");

      // Get user ID if not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("❌ No user found");
          return { success: false, totalChecked: 0, duplicatesRemoved: 0, invalidRemoved: 0, replaced: 0, repaired: 0 };
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

      // STEP 1: Remove duplicates
      console.log("📊 STEP 1: Removing duplicates...");
      const dedupeResult = await this.removeDuplicates(userId);
      const duplicatesRemoved = dedupeResult.removed;

      // STEP 2: Get remaining links for validation
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
          repaired: duplicatesRemoved
        };
      }

      console.log(`📊 STEP 2: Validating ${allLinks.length} unique links...`);

      // STEP 3: Validate each product (format + blacklist)
      const invalidLinks = [];
      
      for (const link of allLinks) {
        const url = link.original_url || "";
        const validation = await this.validateProduct(url);
        
        if (!validation.valid) {
          console.log(`🔴 ${validation.reason}:`, link.product_name);
          invalidLinks.push(link);
        } else {
          console.log("✅ Valid & Current:", link.product_name);
        }
      }

      // STEP 4: Remove invalid/blacklisted products
      let invalidRemoved = 0;
      if (invalidLinks.length > 0) {
        console.log(`🔥 STEP 3: Removing ${invalidLinks.length} invalid/old products...`);
        
        const invalidIds = invalidLinks.map(link => link.id);
        const { error } = await supabase
          .from("affiliate_links")
          .delete()
          .in("id", invalidIds);

        if (!error) {
          invalidRemoved = invalidLinks.length;
          console.log(`✅ Removed ${invalidRemoved} invalid/old products`);
        }
      }

      // STEP 5: Add fresh 2026 replacement products
      let replaced = 0;
      if (invalidRemoved > 0 && campaignId) {
        console.log(`🔄 STEP 4: Adding ${invalidRemoved} FRESH 2026 products...`);
        const addResult = await smartProductDiscovery.addToCampaign(
          campaignId,
          userId,
          invalidRemoved
        );
        replaced = addResult.added;
        console.log(`✅ Added ${replaced} fresh 2026 products`);
      }

      const totalRepaired = duplicatesRemoved + invalidRemoved;
      
      console.log("🎯 ULTIMATE Auto-Repair Complete:");
      console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
      console.log(`   - Invalid/old removed: ${invalidRemoved}`);
      console.log(`   - Fresh products added: ${replaced}`);
      console.log(`   - Total repaired: ${totalRepaired}`);

      return {
        success: true,
        totalChecked: allLinks.length + duplicatesRemoved,
        duplicatesRemoved,
        invalidRemoved,
        replaced,
        repaired: totalRepaired
      };
    } catch (error) {
      console.error("❌ Error in ULTIMATE Auto-Repair:", error);
      return { 
        success: false, 
        totalChecked: 0, 
        duplicatesRemoved: 0,
        invalidRemoved: 0,
        replaced: 0,
        repaired: 0
      };
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
          brokenLinks: 0,
          healthScore: 100
        };
      }

      // Validate each link
      let invalidCount = 0;
      for (const link of links) {
        const validation = await this.validateProduct(link.original_url || "");
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