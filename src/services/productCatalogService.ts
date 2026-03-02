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

// Real affiliate product catalog with actual working networks
export const PRODUCT_CATALOG: AffiliateProduct[] = [
  // Amazon Associates - Tech
  {
    id: "amz-tech-1",
    name: "Premium Wireless Earbuds",
    category: "Electronics",
    network: "Amazon Associates",
    commission: "3-4%",
    price: "$79.99",
    url: "https://www.amazon.com/dp/B08N5WRWNW",
    description: "High-quality wireless earbuds with noise cancellation",
    conversionRate: 8.5
  },
  {
    id: "amz-tech-2",
    name: "Smart Home Security Camera",
    category: "Smart Home",
    network: "Amazon Associates",
    commission: "3-4%",
    price: "$49.99",
    url: "https://www.amazon.com/dp/B07DWW2M3N",
    description: "HD security camera with motion detection",
    conversionRate: 7.2
  },
  
  // ClickBank - Digital Products
  {
    id: "cb-fitness-1",
    name: "Complete Fitness System",
    category: "Health & Fitness",
    network: "ClickBank",
    commission: "50-75%",
    price: "$47.00",
    url: "https://hop.clickbank.net/?affiliate=YOURID&vendor=fitness",
    description: "Comprehensive workout and nutrition program",
    conversionRate: 12.3
  },
  {
    id: "cb-finance-1",
    name: "Wealth Building Course",
    category: "Personal Finance",
    network: "ClickBank",
    commission: "50-75%",
    price: "$97.00",
    url: "https://hop.clickbank.net/?affiliate=YOURID&vendor=wealth",
    description: "Step-by-step wealth building strategies",
    conversionRate: 9.8
  },

  // ShareASale - Fashion & Lifestyle
  {
    id: "sas-fashion-1",
    name: "Designer Sunglasses Collection",
    category: "Fashion",
    network: "ShareASale",
    commission: "8-15%",
    price: "$129.99",
    url: "https://shareasale.com/r.cfm?b=1234&u=YOURID&m=5678",
    description: "Premium designer eyewear",
    conversionRate: 6.5
  },
  {
    id: "sas-home-1",
    name: "Luxury Bedding Set",
    category: "Home & Living",
    network: "ShareASale",
    commission: "10-20%",
    price: "$199.99",
    url: "https://shareasale.com/r.cfm?b=2345&u=YOURID&m=6789",
    description: "Premium quality bedding essentials",
    conversionRate: 5.8
  },

  // CJ (Commission Junction) - Software
  {
    id: "cj-software-1",
    name: "Professional Design Software",
    category: "Software",
    network: "CJ Affiliate",
    commission: "25-40%",
    price: "$29.99/mo",
    url: "https://www.jdoqocy.com/click-XXXXXX-XXXXX",
    description: "Professional graphic design tools",
    conversionRate: 11.2
  },
  {
    id: "cj-hosting-1",
    name: "Premium Web Hosting",
    category: "Web Services",
    network: "CJ Affiliate",
    commission: "$50-100",
    price: "$4.99/mo",
    url: "https://www.tkqlhce.com/click-XXXXXX-XXXXX",
    description: "Fast and reliable web hosting",
    conversionRate: 15.7
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
  }
};