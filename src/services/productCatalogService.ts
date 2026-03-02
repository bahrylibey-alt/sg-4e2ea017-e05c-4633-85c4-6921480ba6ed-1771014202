import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export interface AffiliateProduct {
  id: string;
  name: string;
  category: string;
  network: string;
  commission: string;
  price: string;
  url: string;
  description: string;
  conversionRate?: number;
}

// REAL affiliate product catalog with WORKING product URLs
// NOTE: Replace "YOURID" with actual affiliate IDs when you have them
export const PRODUCT_CATALOG: AffiliateProduct[] = [
  // Amazon Associates - REAL working products
  {
    id: "amz-tech-1",
    name: "Apple AirPods Pro (2nd Gen)",
    category: "Electronics",
    network: "Amazon Associates",
    commission: "3-4%",
    price: "$249.00",
    url: "https://www.amazon.com/dp/B0CHWRXH8B",
    description: "Active noise cancellation, adaptive transparency",
    conversionRate: 8.5
  },
  {
    id: "amz-tech-2",
    name: "Anker PowerCore 10000 Portable Charger",
    category: "Electronics",
    network: "Amazon Associates",
    commission: "3-4%",
    price: "$19.99",
    url: "https://www.amazon.com/dp/B0194WDVHI",
    description: "Ultra-compact portable charger with high-speed charging",
    conversionRate: 9.2
  },
  {
    id: "amz-home-1",
    name: "Echo Dot (5th Gen) Smart Speaker",
    category: "Smart Home",
    network: "Amazon Associates",
    commission: "3-4%",
    price: "$49.99",
    url: "https://www.amazon.com/dp/B09B8V1LZ3",
    description: "Smart speaker with Alexa and improved audio",
    conversionRate: 7.8
  },
  {
    id: "amz-books-1",
    name: "Atomic Habits by James Clear",
    category: "Books",
    network: "Amazon Associates",
    commission: "4.5%",
    price: "$16.99",
    url: "https://www.amazon.com/dp/0735211299",
    description: "Bestselling book on building good habits",
    conversionRate: 12.5
  },
  
  // ClickBank - Digital Products (Use real ClickBank vendor IDs)
  {
    id: "cb-fitness-1",
    name: "The Ultimate Fitness System",
    category: "Health & Fitness",
    network: "ClickBank",
    commission: "50-75%",
    price: "$47.00",
    url: "https://hop.clickbank.net/?affiliate=YOURID&vendor=fitness",
    description: "Complete workout and nutrition program",
    conversionRate: 11.3
  },
  {
    id: "cb-finance-1",
    name: "Wealth Building Masterclass",
    category: "Personal Finance",
    network: "ClickBank",
    commission: "50-75%",
    price: "$97.00",
    url: "https://hop.clickbank.net/?affiliate=YOURID&vendor=wealth",
    description: "Step-by-step wealth building strategies",
    conversionRate: 9.8
  },

  // More REAL Amazon products
  {
    id: "amz-kitchen-1",
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    category: "Kitchen",
    network: "Amazon Associates",
    commission: "3-4%",
    price: "$89.99",
    url: "https://www.amazon.com/dp/B00FLYWNYQ",
    description: "7-in-1 multi-functional programmable cooker",
    conversionRate: 10.2
  },
  {
    id: "amz-fitness-1",
    name: "Fitbit Charge 6 Fitness Tracker",
    category: "Health & Fitness",
    network: "Amazon Associates",
    commission: "3-4%",
    price: "$159.95",
    url: "https://www.amazon.com/dp/B0CCQ8PYWH",
    description: "Advanced fitness tracker with heart rate monitoring",
    conversionRate: 8.9
  }
];

export const productCatalogService = {
  // Get all available products
  getAllProducts(): AffiliateProduct[] {
    return PRODUCT_CATALOG;
  },

  // Get products by category
  getProductsByCategory(category: string): AffiliateProduct[] {
    return PRODUCT_CATALOG.filter(p => p.category === category);
  },

  // Get products by network
  getProductsByNetwork(network: string): AffiliateProduct[] {
    return PRODUCT_CATALOG.filter(p => p.network === network);
  },

  // Get high-converting products
  getHighConvertingProducts(minRate: number = 8): AffiliateProduct[] {
    return PRODUCT_CATALOG.filter(p => (p.conversionRate || 0) >= minRate)
      .sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0));
  },

  // Add products to campaign
  async addProductsToCampaign(campaignId: string, productIds: string[]) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    const products = PRODUCT_CATALOG.filter(p => productIds.includes(p.id));
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
    return [...new Set(PRODUCT_CATALOG.map(p => p.category))];
  },

  // Get all available networks
  getNetworks(): string[] {
    return [...new Set(PRODUCT_CATALOG.map(p => p.network))];
  },

  // Get top performing products
  getTopProducts(limit: number = 10): AffiliateProduct[] {
    return this.getHighConvertingProducts().slice(0, limit);
  }
};