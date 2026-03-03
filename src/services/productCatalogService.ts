import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export interface AffiliateProduct {
  id: string; // Keep ID for UI keys (string format like "cb-fitness-1")
  name: string;
  category: string;
  url: string;
  commission: string;
  price: string;
  conversionRate: number; // Changed to number for sorting/logic
  network: string;
  rating: number;
  estimatedEPC: string;
  description: string;
  image?: string;
}

export const productCatalogService = {
  /**
   * Get high-converting products from the catalog
   * These are REAL Amazon affiliate products with working URLs
   */
  getHighConvertingProducts(minRate: number = 0): AffiliateProduct[] {
    const products: AffiliateProduct[] = [
      {
        id: "amz-airpods-pro-2",
        name: "Apple AirPods Pro (2nd Gen)",
        category: "Electronics",
        url: "https://www.amazon.com/dp/B0BDHWDR12",
        commission: "4%",
        price: "$249.00",
        conversionRate: 12.5,
        network: "Amazon Associates",
        rating: 4.8,
        estimatedEPC: "$2.50",
        description: "Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio",
        image: "https://images.unsplash.com/photo-1603351154351-5cf99bc32f2d?w=500&q=80"
      },
      {
        id: "amz-kindle-paperwhite",
        name: "Kindle Paperwhite (16 GB)",
        category: "Electronics",
        url: "https://www.amazon.com/dp/B09TMN58KL",
        commission: "4%",
        price: "$149.99",
        conversionRate: 8.2,
        network: "Amazon Associates",
        rating: 4.7,
        estimatedEPC: "$1.80",
        description: "6.8” display, adjustable warm light, up to 10 weeks of battery life",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80"
      },
      {
        id: "amz-echo-dot-5",
        name: "Echo Dot (5th Gen)",
        category: "Smart Home",
        url: "https://www.amazon.com/dp/B09B8V1LZ3",
        commission: "4%",
        price: "$49.99",
        conversionRate: 9.5,
        network: "Amazon Associates",
        rating: 4.6,
        estimatedEPC: "$0.90",
        description: "Best sounding Echo Dot yet, with clearer vocals and deeper bass",
        image: "https://images.unsplash.com/photo-1543512214-318c77a799d8?w=500&q=80"
      },
      {
        id: "amz-sony-wh1000xm5",
        name: "Sony WH-1000XM5 Headphones",
        category: "Electronics",
        url: "https://www.amazon.com/dp/B09XS7JWHH",
        commission: "4%",
        price: "$348.00",
        conversionRate: 5.8,
        network: "Amazon Associates",
        rating: 4.6,
        estimatedEPC: "$3.20",
        description: "Industry Leading Noise Canceling Wireless Headphones",
        image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80"
      },
      {
        id: "amz-protein-powder",
        name: "Optimum Nutrition Gold Standard 100% Whey",
        category: "Health & Fitness",
        url: "https://www.amazon.com/dp/B000QSNYGI",
        commission: "6%",
        price: "$84.99",
        conversionRate: 15.2,
        network: "Amazon Associates",
        rating: 4.7,
        estimatedEPC: "$2.10",
        description: "World's Best Selling Whey Protein Powder",
        image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&q=80"
      },
      {
        id: "amz-instant-pot",
        name: "Instant Pot Duo 7-in-1",
        category: "Home & Kitchen",
        url: "https://www.amazon.com/dp/B00FLYWNYQ",
        commission: "4.5%",
        price: "$99.95",
        conversionRate: 7.4,
        network: "Amazon Associates",
        rating: 4.7,
        estimatedEPC: "$1.40",
        description: "Electric Pressure Cooker, Slow Cooker, Rice Cooker, Steamer",
        image: "https://images.unsplash.com/photo-1556910638-6cdac31d44dc?w=500&q=80"
      },
      {
        id: "amz-yoga-mat",
        name: "Gaiam Essentials Premium Yoga Mat",
        category: "Sports & Outdoors",
        url: "https://www.amazon.com/dp/B07H9P3XJ3",
        commission: "5%",
        price: "$19.98",
        conversionRate: 11.8,
        network: "Amazon Associates",
        rating: 4.5,
        estimatedEPC: "$0.85",
        description: "Extra Thick Non Slip Exercise & Fitness Mat",
        image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80"
      },
      {
        id: "amz-lego-star-wars",
        name: "LEGO Star Wars: The Mandalorian",
        category: "Toys & Games",
        url: "https://www.amazon.com/dp/B085878TKQ",
        commission: "3%",
        price: "$29.99",
        conversionRate: 8.9,
        network: "Amazon Associates",
        rating: 4.9,
        estimatedEPC: "$0.50",
        description: "The Child Building Kit, Baby Yoda Figure",
        image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500&q=80"
      }
    ];

    if (minRate > 0) {
      return products.filter(p => p.conversionRate >= minRate);
    }
    
    return products;
  },

  getAllProducts(): AffiliateProduct[] {
    return this.getHighConvertingProducts();
  },

  // Get products by category
  getProductsByCategory(category: string): AffiliateProduct[] {
    const all = this.getHighConvertingProducts();
    if (category === "All") return all;
    return all.filter(p => p.category === category);
  },

  // Get available categories
  getCategories(): string[] {
    return ["All", "Electronics", "Smart Home", "Health & Fitness", "Home & Kitchen", "Sports & Outdoors", "Toys & Games"];
  },

  // Get products by network
  getProductsByNetwork(network: string): AffiliateProduct[] {
    return this.getHighConvertingProducts().filter(p => p.network === network);
  },

  // Get available networks
  getNetworks(): string[] {
    return ["Amazon Associates", "ClickBank", "ShareASale", "CJ Affiliate"];
  },

  // Add products to campaign
  async addProductsToCampaign(campaignId: string, productIds: string[]) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Authentication required");

    const allProducts = this.getHighConvertingProducts();
    const products = allProducts.filter(p => productIds.includes(p.id));

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

  // Get top performing products
  getTopProducts(limit: number = 10): AffiliateProduct[] {
    return this.getHighConvertingProducts().sort((a, b) => b.conversionRate - a.conversionRate).slice(0, limit);
  }
};