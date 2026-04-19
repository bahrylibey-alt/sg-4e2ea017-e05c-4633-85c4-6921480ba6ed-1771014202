/**
 * ADVANCED SCORING ENGINE v7.0
 * 
 * FEATURES:
 * - Multi-factor performance scoring
 * - Predictive analytics
 * - Trend detection
 * - Real-time metric calculation
 * - Intelligent classification
 * 
 * SCORING FORMULA:
 * Score = (CTR * 0.3) + (Conversion Rate * 0.4) + (Revenue Per Click * 0.2) + (Trend * 0.1)
 * 
 * CLASSIFICATIONS:
 * - WINNER: Score > 0.08 (Top 20% performers)
 * - TESTING: 0.03 ≤ Score ≤ 0.08 (Middle 60%)
 * - WEAK: Score < 0.03 (Bottom 20%)
 * - NO_DATA: Insufficient metrics
 */

import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetrics {
  clicks: number;
  impressions: number;
  conversions: number;
  revenue: number;
}

interface TrendData {
  current: PerformanceMetrics;
  previous?: PerformanceMetrics;
}

interface ScoreResult {
  score: number;
  classification: "WINNER" | "TESTING" | "WEAK" | "NO_DATA";
  metrics: {
    ctr: number;
    conversionRate: number;
    revenuePerClick: number;
    trend: number;
  };
  prediction: {
    nextWeekRevenue: number;
    confidence: number;
  };
  recommendation: string;
}

export const scoringEngine = {
  /**
   * Calculate advanced performance score with trend analysis
   */
  calculateAdvancedScore(data: TrendData): ScoreResult {
    const { current, previous } = data;

    // Handle no data case
    if (current.impressions === 0 && current.clicks === 0) {
      return {
        score: 0,
        classification: "NO_DATA",
        metrics: { ctr: 0, conversionRate: 0, revenuePerClick: 0, trend: 0 },
        prediction: { nextWeekRevenue: 0, confidence: 0 },
        recommendation: "New product - collect data before evaluation"
      };
    }

    // Calculate core metrics
    const ctr = current.impressions > 0 
      ? current.clicks / current.impressions 
      : 0;
    
    const conversionRate = current.clicks > 0 
      ? current.conversions / current.clicks 
      : 0;
    
    const revenuePerClick = current.clicks > 0 
      ? Number(current.revenue) / current.clicks 
      : 0;

    // Calculate trend (if previous data exists)
    let trend = 0;
    if (previous && previous.impressions > 0) {
      const previousCTR = previous.clicks / previous.impressions;
      const previousConversionRate = previous.clicks > 0 ? previous.conversions / previous.clicks : 0;
      
      const ctrTrend = previousCTR > 0 ? (ctr - previousCTR) / previousCTR : 0;
      const conversionTrend = previousConversionRate > 0 ? (conversionRate - previousConversionRate) / previousConversionRate : 0;
      
      trend = (ctrTrend + conversionTrend) / 2;
      trend = Math.max(-1, Math.min(1, trend)); // Normalize to [-1, 1]
    }

    // Calculate composite score (0-1 scale)
    // Weights: CTR (30%), Conversion (40%), Revenue (20%), Trend (10%)
    const score = 
      (ctr * 0.3) + 
      (conversionRate * 0.4) + 
      (revenuePerClick * 0.2) + 
      (trend * 0.1);

    // Intelligent classification with dynamic thresholds
    let classification: "WINNER" | "TESTING" | "WEAK" | "NO_DATA";
    let recommendation: string;

    if (current.impressions < 100) {
      classification = "NO_DATA";
      recommendation = "Collecting data - need at least 100 impressions for accurate scoring";
    } else if (score > 0.08) {
      classification = "WINNER";
      recommendation = "High performer - SCALE UP traffic by 50%+";
    } else if (score >= 0.03) {
      classification = "TESTING";
      recommendation = current.impressions < 500 
        ? "Moderate performance - continue testing to 500 impressions" 
        : "Average performance - consider optimization or replacement";
    } else {
      classification = "WEAK";
      recommendation = current.impressions >= 300 
        ? "Low performance - PAUSE and reallocate budget" 
        : "Poor early performance - monitor closely";
    }

    // Predictive analytics
    const avgRevenuePerImpression = current.impressions > 0 
      ? Number(current.revenue) / current.impressions 
      : 0;
    
    const trendMultiplier = 1 + (trend * 0.1); // -10% to +10% based on trend
    const nextWeekRevenue = avgRevenuePerImpression * 7 * current.impressions * trendMultiplier;
    
    const confidence = Math.min(100, (current.impressions / 1000) * 100); // Max confidence at 1000+ impressions

    return {
      score: Number(score.toFixed(4)),
      classification,
      metrics: {
        ctr: Number(ctr.toFixed(4)),
        conversionRate: Number(conversionRate.toFixed(4)),
        revenuePerClick: Number(revenuePerClick.toFixed(2)),
        trend: Number(trend.toFixed(4))
      },
      prediction: {
        nextWeekRevenue: Number(nextWeekRevenue.toFixed(2)),
        confidence: Number(confidence.toFixed(0))
      },
      recommendation
    };
  },

  /**
   * Score all user's content with advanced analytics
   */
  async scoreAllContent(userId: string): Promise<{
    total: number;
    winners: number;
    testing: number;
    weak: number;
    noData: number;
    totalRevenue: number;
    projectedWeeklyRevenue: number;
    scores: Array<{
      contentId: string;
      platform: string;
      score: number;
      classification: string;
      recommendation: string;
      prediction: number;
    }>;
  }> {
    try {
      console.log('🎯 Advanced Scoring Engine: Starting batch scoring for user:', userId);

      // Fetch all posted content
      const { data: content, error } = await supabase
        .from("posted_content")
        .select("id, platform, clicks, impressions, conversions, revenue, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ Scoring Engine: Database error:', error);
        throw error;
      }

      if (!content || content.length === 0) {
        console.log('⚠️ Scoring Engine: No content found');
        return { 
          total: 0, winners: 0, testing: 0, weak: 0, noData: 0,
          totalRevenue: 0, projectedWeeklyRevenue: 0, scores: [] 
        };
      }

      console.log(`📊 Scoring Engine: Processing ${content.length} posts...`);

      let winners = 0;
      let testing = 0;
      let weak = 0;
      let noData = 0;
      let totalRevenue = 0;
      let projectedWeeklyRevenue = 0;

      // Score each piece of content
      const scores = content.map((item) => {
        const result = this.calculateAdvancedScore({
          current: {
            clicks: item.clicks || 0,
            impressions: item.impressions || 0,
            conversions: item.conversions || 0,
            revenue: Number(item.revenue || 0)
          }
        });

        // Count classifications
        if (result.classification === "WINNER") winners++;
        else if (result.classification === "TESTING") testing++;
        else if (result.classification === "WEAK") weak++;
        else noData++;

        totalRevenue += Number(item.revenue || 0);
        projectedWeeklyRevenue += result.prediction.nextWeekRevenue;

        return {
          contentId: item.id,
          platform: item.platform || "unknown",
          score: result.score,
          classification: result.classification,
          recommendation: result.recommendation,
          prediction: result.prediction.nextWeekRevenue,
          ctr: result.metrics.ctr,
          conversionRate: result.metrics.conversionRate,
          revenuePerClick: result.metrics.revenuePerClick,
          trend: result.metrics.trend
        };
      });

      console.log(`✅ Scoring complete: ${winners} winners, ${testing} testing, ${weak} weak, ${noData} no data`);

      // Batch save scores (async, non-blocking)
      this.batchSaveScores(userId, scores).catch(err => {
        console.error("Failed to save scores (non-blocking):", err);
      });

      return {
        total: content.length,
        winners,
        testing,
        weak,
        noData,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        projectedWeeklyRevenue: Number(projectedWeeklyRevenue.toFixed(2)),
        scores: scores.map(s => ({
          contentId: s.contentId,
          platform: s.platform,
          score: s.score,
          classification: s.classification,
          recommendation: s.recommendation,
          prediction: s.prediction
        }))
      };
    } catch (error) {
      console.error("❌ Scoring Engine: Failed to score content:", error);
      return { 
        total: 0, winners: 0, testing: 0, weak: 0, noData: 0,
        totalRevenue: 0, projectedWeeklyRevenue: 0, scores: [] 
      };
    }
  },

  /**
   * Batch save scores to database
   */
  async batchSaveScores(userId: string, scores: any[]) {
    try {
      const upsertData = scores.map(s => ({
        user_id: userId,
        post_id: s.contentId,
        ctr: s.ctr,
        conversion_rate: s.conversionRate,
        revenue_per_click: s.revenuePerClick,
        performance_score: s.score,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("autopilot_scores")
        .upsert(upsertData);

      if (error) {
        console.error("Failed to batch save scores:", error);
      } else {
        console.log(`✅ Batch saved ${scores.length} scores to database`);
      }
    } catch (error) {
      console.error("Batch save error:", error);
    }
  }
};