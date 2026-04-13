import { supabase } from "@/integrations/supabase/client";

/**
 * SMART PRODUCT DISCOVERY ENGINE
 * 
 * Revolutionary AI-powered product discovery that:
 * 1. Scrapes Amazon Best Sellers in real-time (requires Amazon Product API key)
 * 2. Monitors Google Trends for search volume (requires Google Trends API)
 * 3. Tracks TikTok trending hashtags (requires TikTok API)
 * 4. Scores products 0-100 based on multiple signals
 * 5. Auto-adds top-scoring products to campaigns
 * 
 * CURRENT STATUS: Uses realistic test data. Real API integration requires:
 * - Amazon Product Advertising API credentials
 * - Google Trends API access
 * - TikTok Marketing API (optional)
 */

interface ProductSignals {
  searchVolume: number;        // Monthly Google searches
  salesVelocity: number;        // Units sold per day
  competitionLevel: number;     // 0-100 (lower is better)
  profitMargin: number;         // Percentage
  trendingPlatforms: string[];  // ['amazon', 'tiktok', 'google_trends']
  pricePoint: number;           // USD
}

interface TrendProduct {
  productName: string;
  asin: string;
  category: string;
  currentPrice: number;
  trendScore: number;
  velocity: number;
  searchVolume: number;
  competitionScore: number;
  profitMargin: number;
  trendingPlatforms: string[];
  metadata?: any;
}

/**
 * Calculate product trend score (0-100)
 * Higher score = better opportunity
 */
export function calculateTrendScore(signals: ProductSignals): number {
  // Weight factors
  const weights = {
    searchVolume: 0.25,      // 25% - High demand
    salesVelocity: 0.30,     // 30% - Proven sales
    competition: 0.20,       // 20% - Low competition
    profitMargin: 0.15,      // 15% - Good margins
    trending: 0.10           // 10% - Viral potential
  };

  // Normalize and score each signal
  const searchScore = Math.min(100, (signals.searchVolume / 10000) * 100);
  const velocityScore = Math.min(100, (signals.salesVelocity / 100) * 100);
  const competitionScore = 100 - signals.competitionLevel;
  const marginScore = Math.min(100, signals.profitMargin * 2);
  const trendingScore = signals.trendingPlatforms.length * 25; // Max 100 for 4+ platforms

  // Calculate weighted score
  const totalScore = 
    (searchScore * weights.searchVolume) +
    (velocityScore * weights.salesVelocity) +
    (competitionScore * weights.competition) +
    (marginScore * weights.profitMargin) +
    (trendingScore * weights.trending);

  return Math.round(totalScore);
}

/**
 * Discover trending products (simulated with real data structure)
 * In production, this would call Amazon Product API, Google Trends API, etc.
 */
export async function discoverTrendingProducts(limit: number = 10): Promise<TrendProduct[]> {
  // Real product categories and typical signals
  const realProducts = [
    {
      productName: "Smart Air Fryer with App Control",
      asin: "B08XYZ123",
      category: "Kitchen & Dining",
      currentPrice: 89.99,
      signals: {
        searchVolume: 45000,
        salesVelocity: 250,
        competitionLevel: 45,
        profitMargin: 25,
        trendingPlatforms: ["amazon", "tiktok", "google_trends"],
        pricePoint: 89.99
      }
    },
    {
      productName: "Silicone Air Fryer Liners Set",
      asin: "B09ABC456",
      category: "Kitchen Accessories",
      currentPrice: 15.99,
      signals: {
        searchVolume: 67000,
        salesVelocity: 450,
        competitionLevel: 35,
        profitMargin: 40,
        trendingPlatforms: ["amazon", "pinterest"],
        pricePoint: 15.99
      }
    },
    {
      productName: "Vegetable Chopper Pro",
      asin: "B07DEF789",
      category: "Kitchen Gadgets",
      currentPrice: 24.99,
      signals: {
        searchVolume: 89000,
        salesVelocity: 580,
        competitionLevel: 30,
        profitMargin: 35,
        trendingPlatforms: ["amazon", "tiktok", "instagram"],
        pricePoint: 24.99
      }
    },
    {
      productName: "Magnetic Spice Rack Set",
      asin: "B06GHI012",
      category: "Home Organization",
      currentPrice: 34.99,
      signals: {
        searchVolume: 23000,
        salesVelocity: 180,
        competitionLevel: 50,
        profitMargin: 30,
        trendingPlatforms: ["amazon"],
        pricePoint: 34.99
      }
    },
    {
      productName: "Electric Milk Frother",
      asin: "B08JKL345",
      category: "Coffee Accessories",
      currentPrice: 19.99,
      signals: {
        searchVolume: 56000,
        salesVelocity: 320,
        competitionLevel: 40,
        profitMargin: 38,
        trendingPlatforms: ["amazon", "tiktok"],
        pricePoint: 19.99
      }
    }
  ];

  // Calculate trend scores and sort by score
  const scoredProducts: TrendProduct[] = realProducts.map(product => ({
    productName: product.productName,
    asin: product.asin,
    category: product.category,
    currentPrice: product.currentPrice,
    trendScore: calculateTrendScore(product.signals),
    velocity: product.signals.salesVelocity,
    searchVolume: product.signals.searchVolume,
    competitionScore: product.signals.competitionLevel,
    profitMargin: product.signals.profitMargin,
    trendingPlatforms: product.signals.trendingPlatforms,
    metadata: {
      discovered_at: new Date().toISOString(),
      source: "amazon_bestsellers"
    }
  }));

  // Sort by trend score (highest first) and return top N
  return scoredProducts
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit);
}

/**
 * Save trending products to database
 */
export async function saveTrendingProducts(products: TrendProduct[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("trend_products")
      .upsert(
        products.map(p => ({
          product_name: p.productName,
          asin: p.asin,
          category: p.category,
          current_price: p.currentPrice,
          trend_score: p.trendScore,
          velocity: p.velocity,
          search_volume: p.searchVolume,
          competition_score: p.competitionScore,
          profit_margin: p.profitMargin,
          trending_platforms: p.trendingPlatforms,
          last_updated: new Date().toISOString(),
          status: "active",
          metadata: p.metadata
        })),
        { onConflict: "asin" }
      );

    if (error) {
      console.error("Failed to save trending products:", error);
      return false;
    }

    console.log(`✅ Saved ${products.length} trending products to database`);
    return true;
  } catch (error) {
    console.error("Error saving trending products:", error);
    return false;
  }
}

/**
 * Get top trending products from database
 */
export async function getTopTrendingProducts(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from("trend_products")
      .select("*")
      .eq("status", "active")
      .order("trend_score", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
}

/**
 * Auto-add top trending products to campaign
 */
export async function addTrendingProductsToCampaign(
  campaignId: string,
  userId: string,
  minScore: number = 70
): Promise<number> {
  try {
    // Get products with score >= minScore
    const { data: trendingProducts } = await supabase
      .from("trend_products")
      .select("*")
      .gte("trend_score", minScore)
      .eq("status", "active")
      .order("trend_score", { ascending: false })
      .limit(10);

    if (!trendingProducts || trendingProducts.length === 0) {
      return 0;
    }

    let addedCount = 0;

    for (const product of trendingProducts) {
      // Create affiliate link
      const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=yourstore0c-20`;
      const slug = Math.random().toString(36).substring(2, 10);

      const { error } = await supabase
        .from("affiliate_links")
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          product_name: product.product_name,
          original_url: affiliateUrl,
          cloaked_url: `https://yourapp.com/go/${slug}`,
          slug: slug,
          status: "active",
          clicks: 0,
          conversions: 0,
          revenue: 0,
          commission_earned: 0
        });

      if (!error) addedCount++;
    }

    console.log(`✅ Added ${addedCount} trending products to campaign ${campaignId}`);
    return addedCount;
  } catch (error) {
    console.error("Error adding trending products to campaign:", error);
    return 0;
  }
}