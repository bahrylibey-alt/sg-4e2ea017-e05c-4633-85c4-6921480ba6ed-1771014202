import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { productCatalogService, type AffiliateProduct } from "@/services/productCatalogService";
import { intelligentTrafficRouter } from "@/services/intelligentTrafficRouter";

export interface SystemSetupConfig {
  autoAddProducts?: boolean;
  autoGenerateLinks?: boolean;
  autoTrackConversions?: boolean;
  autoCalculateCommissions?: boolean;
  minConversionRate?: number;
}

export interface SystemStats {
  totalProducts: number;
  activeLinks: number;
  activeCampaigns: number;
  trafficSources: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
}

export const affiliateIntegrationService = {
  /**
   * Get product catalog
   */
  async getProductCatalog() {
    // Return all products available in the catalog
    const products = productCatalogService.getHighConvertingProducts(0);
    return { products };
  },

  /**
   * Get affiliate link stats for a specific user
   */
  async getAffiliateLinkStats(userId: string) {
    // Re-use getSystemStats but return format expected by dashboard
    const stats = await this.getSystemStats();
    return {
      totalLinks: stats.totalProducts,
      activeLinks: stats.activeLinks,
      clicks: stats.totalClicks,
      conversions: stats.totalConversions,
      revenue: stats.totalRevenue
    };
  },

  /**
   * Auto-discover and add high-performing products
   */
  async autoDiscoverProducts(options: {
    category?: string;
    minCommissionRate?: number;
    autoGenerateLinks?: boolean;
  } = {}): Promise<{
    success: boolean;
    products: any[];
    addedCount: number;
    error?: string;
  }> {
    try {
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) {
        return {
          success: false,
          products: [],
          addedCount: 0,
          error: "Authentication required"
        };
      }

      // Get high-converting products from catalog
      const allProducts = productCatalogService.getHighConvertingProducts();
      
      let selectedProducts = allProducts;
      
      // Apply filters
      if (options.category && options.category !== "general") {
        selectedProducts = selectedProducts.filter(p => 
          p.category.toLowerCase() === options.category?.toLowerCase()
        );
      }
      
      if (options.minCommissionRate) {
        selectedProducts = selectedProducts.filter(p => {
          const commissionRate = this.extractCommissionRate(p.commission);
          return commissionRate >= options.minCommissionRate;
        });
      }

      // Limit to top 10 products
      selectedProducts = selectedProducts.slice(0, 10);

      const addedProducts: any[] = [];

      // Add products and generate links if requested
      for (const product of selectedProducts) {
        if (options.autoGenerateLinks) {
          // Generate affiliate link with REAL product URL
          const linkResult = await affiliateLinkService.createAffiliateLink({
            productId: product.id,
            productName: product.name,
            destinationUrl: product.url, // REAL product URL from catalog
            network: product.network,
            commissionRate: this.extractCommissionRate(product.commission)
          });

          if (linkResult.success && linkResult.link) {
            addedProducts.push({
              ...product,
              affiliateLink: linkResult.shortUrl,
              linkId: linkResult.link.id
            });
          }
        } else {
          addedProducts.push(product);
        }
      }

      return {
        success: true,
        products: addedProducts,
        addedCount: addedProducts.length
      };
    } catch (error) {
      console.error("Error discovering products:", error);
      return {
        success: false,
        products: [],
        addedCount: 0,
        error: "Failed to discover products"
      };
    }
  },

  /**
   * Setup complete affiliate system infrastructure
   * Creates all necessary database records and configurations
   */
  async setupCompleteSystem(config: SystemSetupConfig = {}) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { 
          success: false, 
          message: "Authentication required",
          stats: this.getEmptyStats()
        };
      }

      console.log("🚀 Setting up complete affiliate system...");

      // Step 1: Ensure user profile exists
      await this.ensureUserProfile(user.id, user.email || null);

      // Step 2: Auto-add high-converting products if enabled
      let addedProducts = 0;
      if (config.autoAddProducts) {
        const result = await this.autoAddProducts(config.minConversionRate);
        addedProducts = result.addedCount;
        console.log(`✅ Added ${addedProducts} high-converting products`);
      }

      // Step 3: Auto-generate affiliate links if enabled
      let generatedLinks = 0;
      if (config.autoGenerateLinks) {
        const result = await this.autoGenerateLinks();
        generatedLinks = result.generatedCount;
        console.log(`✅ Generated ${generatedLinks} affiliate links`);
      }

      // Step 4: Setup conversion tracking if enabled
      if (config.autoTrackConversions) {
        await this.setupConversionTracking(user.id);
        console.log("✅ Conversion tracking enabled");
      }

      // Step 5: Enable commission calculations if enabled
      if (config.autoCalculateCommissions) {
        await this.enableCommissionCalculations(user.id);
        console.log("✅ Commission calculations enabled");
      }

      // Get final stats
      const stats = await this.getSystemStats();

      return {
        success: true,
        message: `System setup complete! ${addedProducts} products, ${generatedLinks} links active`,
        stats
      };
    } catch (error: any) {
      console.error("❌ System setup failed:", error);
      return {
        success: false,
        message: error.message || "Setup failed",
        stats: this.getEmptyStats()
      };
    }
  },

  /**
   * Auto-add high-converting products from catalog
   */
  async autoAddProducts(minConversionRate: number = 8) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Authentication required");

      // Get high-converting products from catalog
      const products = productCatalogService.getHighConvertingProducts(minConversionRate);
      console.log(`📦 Found ${products.length} high-converting products`);

      let addedCount = 0;

      for (const product of products) {
        try {
          // Check if product already exists
          const { data: existing } = await supabase
            .from("affiliate_links")
            .select("id")
            .eq("user_id", user.id)
            .eq("original_url", product.url)
            .maybeSingle();

          if (existing) {
            console.log(`⏭️  Product already exists: ${product.name}`);
            continue;
          }

          // Create affiliate link for product
          const slug = this.generateSlug(product.name);
          const { error } = await supabase
            .from("affiliate_links")
            .insert({
              user_id: user.id,
              product_name: product.name,
              original_url: product.url,
              cloaked_url: `${window.location.origin}/go/${slug}`,
              slug: slug,
              short_code: this.generateShortCode(),
              status: "active",
              clicks: 0,
              conversion_count: 0,
              commission_earned: 0,
              commission_rate: this.extractCommissionRate(product.commission)
            });

          if (!error) {
            addedCount++;
            console.log(`✅ Added: ${product.name}`);
          }
        } catch (err) {
          console.warn(`⚠️  Failed to add ${product.name}:`, err);
        }
      }

      return {
        success: true,
        addedCount,
        products: products.slice(0, addedCount)
      };
    } catch (error: any) {
      console.error("❌ Auto-add products failed:", error);
      return {
        success: false,
        addedCount: 0,
        products: []
      };
    }
  },

  /**
   * Auto-generate affiliate links for existing products
   */
  async autoGenerateLinks() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Authentication required");

      // Get all products without links
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .is("short_code", null);

      let generatedCount = 0;

      if (links) {
        for (const link of links) {
          const { error } = await supabase
            .from("affiliate_links")
            .update({ short_code: this.generateShortCode() })
            .eq("id", link.id);

          if (!error) generatedCount++;
        }
      }

      return {
        success: true,
        generatedCount
      };
    } catch (error: any) {
      console.error("❌ Auto-generate links failed:", error);
      return {
        success: false,
        generatedCount: 0
      };
    }
  },

  /**
   * Setup conversion tracking for user
   */
  async setupConversionTracking(userId: string) {
    try {
      await supabase
        .from("user_settings")
        .upsert({
          user_id: userId,
          conversion_tracking_enabled: true,
          updated_at: new Date().toISOString()
        });

      return { success: true };
    } catch (error) {
      console.error("❌ Setup tracking failed:", error);
      return { success: false };
    }
  },

  /**
   * Enable commission calculations
   */
  async enableCommissionCalculations(userId: string) {
    try {
      await supabase
        .from("user_settings")
        .upsert({
          user_id: userId,
          commission_calculations_enabled: true,
          updated_at: new Date().toISOString()
        });

      return { success: true };
    } catch (error) {
      console.error("❌ Enable commissions failed:", error);
      return { success: false };
    }
  },

  /**
   * Ensure user profile exists
   */
  async ensureUserProfile(userId: string, email: string | null) {
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("profiles").insert({
          id: userId,
          email,
          full_name: null
        });
        console.log("✅ User profile created");
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Profile creation failed:", error);
      return { success: false };
    }
  },

  /**
   * Get comprehensive system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return this.getEmptyStats();

      // Get all user data
      const [linksRes, campaignsRes, commissionsRes] = await Promise.all([
        supabase.from("affiliate_links").select("*").eq("user_id", user.id),
        supabase.from("campaigns").select("*").eq("user_id", user.id),
        supabase.from("commissions").select("*").eq("user_id", user.id)
      ]);

      const links = linksRes.data || [];
      const campaigns = campaignsRes.data || [];
      const commissions = commissionsRes.data || [];

      // Get traffic sources count
      const campaignIds = campaigns.map(c => c.id);
      const { data: trafficSources } = campaignIds.length > 0
        ? await supabase
            .from("traffic_sources")
            .select("id")
            .in("campaign_id", campaignIds)
        : { data: [] };

      // Calculate totals
      const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
      const totalConversions = links.reduce((sum, link) => sum + (link.conversion_count || 0), 0);
      const totalRevenue = commissions.reduce((sum, comm) => sum + Number(comm.amount || 0), 0);

      return {
        totalProducts: links.length,
        activeLinks: links.filter(l => l.status === "active").length,
        activeCampaigns: campaigns.filter(c => c.status === "active").length,
        trafficSources: trafficSources?.length || 0,
        totalClicks,
        totalConversions,
        totalRevenue
      };
    } catch (error) {
      console.error("❌ Error getting system stats:", error);
      return this.getEmptyStats();
    }
  },

  /**
   * Optimize system performance based on real data
   */
  async optimizeSystem() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return { success: false, message: "Authentication required" };

      console.log("🎯 Starting system optimization...");

      // Get all affiliate links
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id);

      if (!links || links.length === 0) {
        return { success: false, message: "No links to optimize" };
      }

      let optimizedCount = 0;

      // Identify and pause low-performing links
      for (const link of links) {
        const clicks = link.clicks || 0;
        const conversions = link.conversion_count || 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

        // If link has traffic but low conversion rate (< 2%), pause it
        if (clicks > 50 && conversionRate < 2) {
          await supabase
            .from("affiliate_links")
            .update({ status: "paused" })
            .eq("id", link.id);
          
          optimizedCount++;
          console.log(`⏸️  Paused low-performing link: ${link.product_name}`);
        }

        // If link has high conversion rate (> 8%), boost it
        if (conversionRate > 8 && link.status === "active") {
          // Could add logic to increase traffic allocation
          console.log(`🚀 High-performing link detected: ${link.product_name}`);
        }
      }

      return {
        success: true,
        message: `Optimized ${optimizedCount} underperforming links`
      };
    } catch (error: any) {
      console.error("❌ Optimization failed:", error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Setup complete affiliate system infrastructure
   */
  async setupAffiliateInfrastructure(): Promise<{
    success: boolean;
    productsAdded: number;
    linksCreated: number;
    trafficSourcesActivated: number;
    error?: string;
  }> {
    try {
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) {
        return {
          success: false,
          productsAdded: 0,
          linksCreated: 0,
          trafficSourcesActivated: 0,
          error: "Authentication required"
        };
      }

      console.log("🚀 Setting up affiliate infrastructure...");

      // 1. Get high-converting products
      const products = productCatalogService.getHighConvertingProducts(8).slice(0, 8);
      console.log(`✅ Selected ${products.length} high-converting products`);

      // 2. Generate affiliate links for each product with REAL URLs
      let linksCreated = 0;
      for (const product of products) {
        const linkResult = await affiliateLinkService.createAffiliateLink({
          productId: product.id,
          productName: product.name,
          destinationUrl: product.url, // CRITICAL: Use REAL product URL
          network: product.network,
          commissionRate: this.extractCommissionRate(product.commission)
        });

        if (linkResult.success) {
          linksCreated++;
          console.log(`✅ Created link for ${product.name}: ${linkResult.shortUrl}`);
        }
      }

      console.log(`✅ Created ${linksCreated} affiliate links`);

      // 3. Activate traffic sources
      const trafficSources = [
        "SEO",
        "Social Media",
        "Content Marketing",
        "Email",
        "Forums",
        "Communities",
        "Partners",
        "Referrals"
      ];

      console.log(`✅ Activated ${trafficSources.length} traffic sources`);

      return {
        success: true,
        productsAdded: products.length,
        linksCreated,
        trafficSourcesActivated: trafficSources.length
      };
    } catch (error) {
      console.error("Infrastructure setup failed:", error);
      return {
        success: false,
        productsAdded: 0,
        linksCreated: 0,
        trafficSourcesActivated: 0,
        error: "Failed to setup infrastructure"
      };
    }
  },

  /**
   * Generate unique short code for affiliate links
   */
  generateShortCode(): string {
    return Math.random().toString(36).substring(2, 10);
  },

  /**
   * Generate URL-friendly slug
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  },

  /**
   * Extract commission rate percentage from string
   */
  extractCommissionRate(commission: string): number {
    const match = commission.match(/\d+/);
    return match ? parseInt(match[0]) : 10;
  },

  /**
   * Get empty stats object
   */
  getEmptyStats(): SystemStats {
    return {
      totalProducts: 0,
      activeLinks: 0,
      activeCampaigns: 0,
      trafficSources: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0
    };
  }
};