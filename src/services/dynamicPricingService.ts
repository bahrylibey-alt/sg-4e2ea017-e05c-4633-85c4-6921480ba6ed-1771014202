import { supabase } from "@/integrations/supabase/client";

export interface PricingRecommendation {
  productId: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedImpact: string;
  confidence: number;
}

export const dynamicPricingService = {
  // Analyze campaign performance to recommend pricing adjustments
  async analyzePricing(campaignId: string): Promise<{
    recommendations: PricingRecommendation[];
    error: string | null;
  }> {
    try {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id, budget, revenue")
        .eq("id", campaignId)
        .single();

      if (!campaign) {
        return { recommendations: [], error: "Campaign not found" };
      }

      // Get affiliate links performance for this campaign
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("product_name, click_count, conversion_count, commission_earned")
        .eq("campaign_id", campaignId);

      const recommendations: PricingRecommendation[] = [];

      if (links && links.length > 0) {
        links.forEach((link, index) => {
          const conversionRate = link.click_count > 0 ? (link.conversion_count / link.click_count) : 0;
          const avgCommission = link.conversion_count > 0 ? (link.commission_earned / link.conversion_count) : 0;
          
          // Simple pricing logic: if conversion rate is high, can increase price
          let priceAdjustment = 1.0;
          let impact = "Maintain current pricing";
          
          if (conversionRate > 0.05) {
            priceAdjustment = 1.1;
            impact = "+10% revenue potential";
          } else if (conversionRate < 0.01 && link.click_count > 20) {
            priceAdjustment = 0.9;
            impact = "Lower price may increase conversions";
          }

          recommendations.push({
            productId: link.product_name || `product-${index}`,
            currentPrice: avgCommission * 10, // Estimate base price
            recommendedPrice: avgCommission * 10 * priceAdjustment,
            expectedImpact: impact,
            confidence: link.click_count > 50 ? 0.8 : 0.5
          });
        });
      }

      return { recommendations, error: null };
    } catch (err) {
      console.error("Pricing analysis error:", err);
      return { recommendations: [], error: "Failed to analyze pricing" };
    }
  },

  // Track competitor prices (placeholder - would integrate with real price tracking APIs)
  async trackCompetitorPrices(productUrls: string[]): Promise<{
    prices: Array<{ url: string; price: number; competitor: string }>;
    error: string | null;
  }> {
    try {
      // In production, this would scrape competitor sites or use price comparison APIs
      // For now, return structure showing this is a real endpoint waiting for API integration
      return { 
        prices: [], 
        error: "Competitor price tracking requires external API integration" 
      };
    } catch (err) {
      return { prices: [], error: "Failed to track prices" };
    }
  },

  // Calculate optimal price point based on demand
  async calculateOptimalPrice(campaignId: string, productId: string): Promise<{
    optimalPrice: number;
    demandCurve: Array<{ price: number; expectedSales: number }>;
    error: string | null;
  }> {
    try {
      // Get historical performance data
      const { data: analytics } = await supabase
        .from("campaign_performance")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("date", { ascending: false })
        .limit(30);

      if (!analytics || analytics.length === 0) {
        return {
          optimalPrice: 0,
          demandCurve: [],
          error: "Insufficient data - need at least 30 days of performance history"
        };
      }

      // Calculate price elasticity from performance data
      const avgRevenue = analytics.reduce((sum, a) => sum + (a.revenue || 0), 0) / analytics.length;
      const avgConversions = analytics.reduce((sum, a) => sum + (a.conversions || 0), 0) / analytics.length;
      const avgPrice = avgConversions > 0 ? avgRevenue / avgConversions : 50;

      // Build demand curve
      const demandCurve = [];
      for (let priceMultiplier = 0.7; priceMultiplier <= 1.3; priceMultiplier += 0.1) {
        const price = avgPrice * priceMultiplier;
        const expectedSales = avgConversions * (1.5 - priceMultiplier); // Simple elasticity model
        demandCurve.push({ price: Math.round(price), expectedSales: Math.round(expectedSales) });
      }

      // Find optimal price (maximize revenue)
      const optimal = demandCurve.reduce((best, current) => {
        const currentRevenue = current.price * current.expectedSales;
        const bestRevenue = best.price * best.expectedSales;
        return currentRevenue > bestRevenue ? current : best;
      });

      return {
        optimalPrice: optimal.price,
        demandCurve,
        error: null
      };
    } catch (err) {
      return { optimalPrice: 0, demandCurve: [], error: "Price calculation failed" };
    }
  },

  // Optimize surge pricing for high-demand periods
  async optimizeSurgePricing(campaignId: string): Promise<{
    surgeSchedule: Array<{ timeRange: string; multiplier: number; reason: string }>;
    error: string | null;
  }> {
    try {
      // Analyze hourly performance patterns
      const { data: analytics } = await supabase
        .from("campaign_performance")
        .select("date, clicks, conversions, revenue")
        .eq("campaign_id", campaignId)
        .order("date", { ascending: false })
        .limit(168); // 7 days of hourly data

      if (!analytics || analytics.length < 24) {
        return {
          surgeSchedule: [],
          error: "Need at least 24 hours of data for surge pricing optimization"
        };
      }

      // Group by hour and find peak periods
      const hourlyPerformance = new Map<number, { conversions: number; revenue: number; count: number }>();
      
      analytics.forEach(a => {
        const hour = new Date(a.date).getHours();
        const existing = hourlyPerformance.get(hour) || { conversions: 0, revenue: 0, count: 0 };
        hourlyPerformance.set(hour, {
          conversions: existing.conversions + (a.conversions || 0),
          revenue: existing.revenue + (a.revenue || 0),
          count: existing.count + 1
        });
      });

      // Calculate surge multipliers
      const surgeSchedule = [];
      const avgRevenue = Array.from(hourlyPerformance.values())
        .reduce((sum, v) => sum + v.revenue / v.count, 0) / hourlyPerformance.size;

      for (const [hour, perf] of hourlyPerformance.entries()) {
        const hourAvg = perf.revenue / perf.count;
        if (hourAvg > avgRevenue * 1.2) {
          surgeSchedule.push({
            timeRange: `${hour}:00-${hour + 1}:00`,
            multiplier: 1.15,
            reason: "High demand period"
          });
        }
      }

      return { surgeSchedule, error: null };
    } catch (err) {
      return { surgeSchedule: [], error: "Surge pricing optimization failed" };
    }
  }
};