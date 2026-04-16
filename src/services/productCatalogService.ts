import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export interface AffiliateProduct {
  id: string;
  name: string;
  category: string;
  url: string;
  commission: string;
  price: string;
  conversionRate: number;
  network: string;
  rating: number;
  estimatedEPC: string;
  description: string;
  image?: string;
}

export const productCatalogService = {
  /**
   * Get products from DATABASE ONLY - NO hardcoded products
   */
  async getHighConvertingProducts(minRate: number = 0): Promise<AffiliateProduct[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("⚠️ No authenticated user - returning empty array");
        return [];
      }

      // Get products from product_catalog table (real discovered products)
      const { data: catalogProducts, error } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('status', 'active')
        .gte('conversion_rate', minRate)
        .order('conversion_rate', { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ Error fetching products:", error);
        return [];
      }

      if (!catalogProducts || catalogProducts.length === 0) {
        console.log("⚠️ No products found in catalog - run product discovery first");
        return [];
      }

      console.log(`✅ Fetched ${catalogProducts.length} products from database`);

      // Convert to AffiliateProduct format
      return catalogProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || 'General',
        url: p.affiliate_url,
        commission: `${p.commission_rate}%`,
        price: `$${p.price}`,
        conversionRate: p.conversion_rate || 0,
        network: p.network,
        rating: p.rating || 4.5,
        estimatedEPC: `$${((p.price * p.commission_rate / 100) * (p.conversion_rate / 100)).toFixed(2)}`,
        description: p.description || '',
        image: p.image_url || undefined
      }));
    } catch (error) {
      console.error("❌ Exception fetching products:", error);
      return [];
    }
  },

  async getAllProducts(): Promise<AffiliateProduct[]> {
    return this.getHighConvertingProducts(0);
  },

  async getProductsByCategory(category: string): Promise<AffiliateProduct[]> {
    const all = await this.getHighConvertingProducts(0);
    if (category === "All") return all;
    return all.filter(p => p.category === category);
  },

  async getCategories(): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('product_catalog')
        .select('category')
        .eq('status', 'active');

      if (!data) return ["All"];

      const categories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
      return ["All", ...categories];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return ["All"];
    }
  },

  async getProductsByNetwork(network: string): Promise<AffiliateProduct[]> {
    const all = await this.getHighConvertingProducts(0);
    if (network === "All Networks") return all;
    return all.filter(p => p.network === network);
  },

  async getNetworks(): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('product_catalog')
        .select('network')
        .eq('status', 'active');

      if (!data) return ["All Networks"];

      const networks = Array.from(new Set(data.map(p => p.network).filter(Boolean)));
      return ["All Networks", ...networks];
    } catch (error) {
      console.error("Error fetching networks:", error);
      return ["All Networks"];
    }
  },

  async addProductsToCampaign(
    campaignId: string,
    productIds: string[]
  ): Promise<any[]> {
    try {
      const allProducts = await this.getHighConvertingProducts(0);
      
      const campaignProducts = productIds.map((productId) => {
        const product = allProducts.find((p) => p.id === productId);
        if (!product) return null;

        return {
          campaign_id: campaignId,
          product_id: productId,
          product_name: product.name,
          network: product.network,
          commission_rate: parseFloat(product.commission),
          created_at: new Date().toISOString(),
        };
      }).filter(Boolean);

      if (campaignProducts.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("campaign_products")
        .insert(campaignProducts)
        .select();

      if (error) {
        console.error("Error adding products to campaign:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to add products to campaign:", error);
      return [];
    }
  },

  async getCampaignProducts(campaignId: string) {
    const { data, error } = await supabase
      .from("campaign_products")
      .select("*")
      .eq("campaign_id", campaignId);

    if (error) {
      console.error("Failed to fetch campaign products:", error);
      return [];
    }

    return data || [];
  },

  async getTopProducts(limit: number = 10): Promise<AffiliateProduct[]> {
    const products = await this.getHighConvertingProducts(0);
    return products
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);
  }
};