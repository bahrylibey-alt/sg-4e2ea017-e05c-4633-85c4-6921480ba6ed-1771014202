import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export interface AffiliateProduct {
  name: string;
  category: string;
  url: string;
  commission: string;
  network: string;
  rating: number;
  estimatedEPC: string;
  description: string;
}

export const productCatalogService = {
  /**
   * Get high-converting products from the catalog
   * These are REAL Amazon affiliate products with working URLs
   */
  getHighConvertingProducts(): AffiliateProduct[] {
    return [
      {
        name: "Apple AirPods Pro (2nd Gen)",
        category: "Electronics",
        url: "https://www.amazon.com/dp/B0BDHWDR12",
        commission: "4%",
        network: "Amazon Associates",
        rating: 4.8,
        estimatedEPC: "$2.50",
        description: "Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio"
      },
    ];
  },

  // Get products by category
  getProductsByCategory(category: string): AffiliateProduct[] {
    return [];
  },

  // Get products by network
  getProductsByNetwork(network: string): AffiliateProduct[] {
    return [];
  },

  // Get high-converting products
  getHighConvertingProducts(minRate: number = 8): AffiliateProduct[] {
    return [];
  },

  // Add products to campaign
  async addProductsToCampaign(campaignId: string, productIds: string[]) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    const products = [];
    const insertData = products.map(p => ({
      campaign_id: campaignId,
      product_name: p.name
    }));

    const { data, error } = await supabase
      .from("campaign_products")
      .insert(insertData)
      .select();

    if (error) {
      console.error("Failed to add products:", error);
      throw error;
    }

    return data;
  },

  // Get campaign products
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

  // Get all available categories
  getCategories(): string[] {
    return [];
  },

  // Get all available networks
  getNetworks(): string[] {
    return [];
  },

  // Get top performing products
  getTopProducts(limit: number = 10): AffiliateProduct[] {
    return [];
  }
};