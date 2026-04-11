import { supabase } from "@/integrations/supabase/client";

/**
 * AI INSIGHTS ENGINE v1.0
 * Analyzes channel performance and suggests content adjustments
 * 
 * Uses REAL database data to generate actionable recommendations
 */

export interface ChannelInsight {
  channel: string;
  insight: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  metric: string;
  currentValue: number;
  targetValue: number;
  expectedImprovement: string;
}

export interface ContentAdjustment {
  type: 'hook' | 'format' | 'timing' | 'platform' | 'cta';
  current: string;
  suggested: string;
  reason: string;
  expectedImpact: string;
}

export const aiInsightsEngine = {
  /**
   * Analyze all channels and generate insights
   */
  async generateChannelInsights(userId: string): Promise<ChannelInsight[]> {
    try {
      const insights: ChannelInsight[] = [];

      // Get channel performance data
      const { data: posts } = await supabase
        .from('posted_content')
        .select('platform, impressions, clicks, conversions, ctr, created_at')
        .eq('user_id', userId)
        .eq('status', 'posted')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!posts || posts.length === 0) {
        return [{
          channel: 'All Channels',
          insight: 'No data available yet',
          recommendation: 'Start posting content to get insights',
          priority: 'high',
          metric: 'Posts',
          currentValue: 0,
          targetValue: 10,
          expectedImprovement: 'Begin tracking performance'
        }];
      }

      // Aggregate by platform
      const platformData: Record<string, {
        posts: number;
        views: number;
        clicks: number;
        conversions: number;
        avgCtr: number;
      }> = {};

      posts.forEach(post => {
        const platform = post.platform || 'unknown';
        
        if (!platformData[platform]) {
          platformData[platform] = {
            posts: 0,
            views: 0,
            clicks: 0,
            conversions: 0,
            avgCtr: 0
          };
        }

        platformData[platform].posts++;
        platformData[platform].views += post.impressions || 0;
        platformData[platform].clicks += post.clicks || 0;
        platformData[platform].conversions += post.conversions || 0;
      });

      // Calculate CTR and generate insights
      Object.entries(platformData).forEach(([platform, data]) => {
        data.avgCtr = data.views > 0 ? (data.clicks / data.views) * 100 : 0;

        // Low CTR insight
        if (data.avgCtr < 1 && data.views > 100) {
          insights.push({
            channel: platform,
            insight: `Low click-through rate (${data.avgCtr.toFixed(2)}%)`,
            recommendation: 'Improve hook quality - try curiosity-driven headlines',
            priority: 'high',
            metric: 'CTR',
            currentValue: data.avgCtr,
            targetValue: 2.5,
            expectedImprovement: '+150% more clicks'
          });
        }

        // Good CTR insight
        if (data.avgCtr > 2) {
          insights.push({
            channel: platform,
            insight: `Strong CTR (${data.avgCtr.toFixed(2)}%)`,
            recommendation: 'Scale this channel - double posting frequency',
            priority: 'high',
            metric: 'CTR',
            currentValue: data.avgCtr,
            targetValue: data.avgCtr * 1.5,
            expectedImprovement: '2x traffic potential'
          });
        }

        // Low views insight
        if (data.views < 50 && data.posts > 5) {
          insights.push({
            channel: platform,
            insight: 'Low visibility - content not reaching audience',
            recommendation: 'Use platform-specific hashtags and post during peak hours',
            priority: 'medium',
            metric: 'Views',
            currentValue: data.views,
            targetValue: 200,
            expectedImprovement: '4x visibility boost'
          });
        }

        // Zero conversions insight
        if (data.clicks > 20 && data.conversions === 0) {
          insights.push({
            channel: platform,
            insight: 'Getting clicks but no conversions',
            recommendation: 'Align landing page with hook promise - reduce friction',
            priority: 'high',
            metric: 'Conversion Rate',
            currentValue: 0,
            targetValue: 3,
            expectedImprovement: 'Start generating revenue'
          });
        }

        // High performing channel
        if (data.conversions > 3 && data.avgCtr > 2) {
          insights.push({
            channel: platform,
            insight: `Top performer - ${data.conversions} conversions`,
            recommendation: 'Clone winning content patterns - create 5 variations',
            priority: 'high',
            metric: 'Conversions',
            currentValue: data.conversions,
            targetValue: data.conversions * 2,
            expectedImprovement: 'Double revenue potential'
          });
        }
      });

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return insights.slice(0, 8); // Return top 8 insights

    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  },

  /**
   * Generate content adjustment suggestions based on performance
   */
  async generateContentAdjustments(userId: string): Promise<ContentAdjustment[]> {
    try {
      const adjustments: ContentAdjustment[] = [];

      // Get recent low-performing content
      const { data: lowPerformers } = await supabase
        .from('posted_content')
        .select('id, caption, platform, impressions, clicks, ctr')
        .eq('user_id', userId)
        .eq('status', 'posted')
        .lt('ctr', 1)
        .gte('impressions', 50)
        .order('created_at', { ascending: false })
        .limit(5);

      if (lowPerformers && lowPerformers.length > 0) {
        // Analyze common issues
        lowPerformers.forEach(post => {
          const caption = post.caption || '';

          // Check hook quality
          if (!caption.includes('$') && !caption.toLowerCase().includes('free')) {
            adjustments.push({
              type: 'hook',
              current: caption.substring(0, 50) + '...',
              suggested: 'Add money hook: "Made $127 in 1 day with this..."',
              reason: 'Curiosity-driven hooks with specific numbers perform 3x better',
              expectedImpact: '+200% CTR'
            });
          }

          // Check for CTA
          if (!caption.toLowerCase().includes('link') && !caption.toLowerCase().includes('bio')) {
            adjustments.push({
              type: 'cta',
              current: 'Missing clear call-to-action',
              suggested: 'Add "Link in bio 👆" or "Check it out here →"',
              reason: 'Clear CTAs increase click-through by 150%',
              expectedImpact: '+150% clicks'
            });
          }

          // Platform-specific suggestions
          if (post.platform === 'tiktok' && caption.length > 100) {
            adjustments.push({
              type: 'format',
              current: 'Long caption on TikTok',
              suggested: 'Keep under 60 characters - make it punchy',
              reason: 'TikTok users prefer short, snappy text',
              expectedImpact: '+80% engagement'
            });
          }

          if (post.platform === 'pinterest' && !caption.toLowerCase().includes('best') && !caption.toLowerCase().includes('top')) {
            adjustments.push({
              type: 'hook',
              current: caption.substring(0, 50) + '...',
              suggested: 'Use SEO keywords: "Best Kitchen Gadgets 2026"',
              reason: 'Pinterest favors SEO-optimized titles',
              expectedImpact: '+300% reach'
            });
          }
        });
      }

      // Get high-performing content for pattern learning
      const { data: topPerformers } = await supabase
        .from('posted_content')
        .select('platform, caption, ctr')
        .eq('user_id', userId)
        .eq('status', 'posted')
        .gt('ctr', 2)
        .order('ctr', { ascending: false })
        .limit(3);

      if (topPerformers && topPerformers.length > 0) {
        adjustments.push({
          type: 'platform',
          current: 'Posting on all platforms equally',
          suggested: `Focus on ${topPerformers[0].platform} - it's your best performer`,
          reason: `${topPerformers[0].platform} has ${topPerformers[0].ctr.toFixed(2)}% CTR vs others`,
          expectedImpact: '2x efficiency'
        });
      }

      // Remove duplicates
      const unique = adjustments.filter((adj, index, self) =>
        index === self.findIndex(a => a.type === adj.type && a.suggested === adj.suggested)
      );

      return unique.slice(0, 6); // Return top 6 adjustments

    } catch (error) {
      console.error('Error generating adjustments:', error);
      return [];
    }
  },

  /**
   * Get best posting times based on historical performance
   */
  async getBestPostingTimes(userId: string): Promise<{
    platform: string;
    bestHours: number[];
    reason: string;
  }[]> {
    try {
      const { data: posts } = await supabase
        .from('posted_content')
        .select('platform, posted_at, impressions')
        .eq('user_id', userId)
        .eq('status', 'posted')
        .not('posted_at', 'is', null);

      if (!posts || posts.length === 0) {
        return [];
      }

      const platformHours: Record<string, Record<number, { count: number; totalViews: number }>> = {};

      posts.forEach(post => {
        const platform = post.platform || 'unknown';
        const hour = new Date(post.posted_at).getHours();

        if (!platformHours[platform]) {
          platformHours[platform] = {};
        }

        if (!platformHours[platform][hour]) {
          platformHours[platform][hour] = { count: 0, totalViews: 0 };
        }

        platformHours[platform][hour].count++;
        platformHours[platform][hour].totalViews += post.impressions || 0;
      });

      const recommendations: any[] = [];

      Object.entries(platformHours).forEach(([platform, hours]) => {
        const hourStats = Object.entries(hours).map(([hour, stats]) => ({
          hour: parseInt(hour),
          avgViews: stats.totalViews / stats.count
        }));

        hourStats.sort((a, b) => b.avgViews - a.avgViews);

        const bestHours = hourStats.slice(0, 3).map(h => h.hour);

        recommendations.push({
          platform,
          bestHours,
          reason: `Posts at ${bestHours.join(', ')}:00 get ${Math.round(hourStats[0].avgViews)} avg views`
        });
      });

      return recommendations;

    } catch (error) {
      console.error('Error calculating best times:', error);
      return [];
    }
  },

  /**
   * Generate overall performance summary
   */
  async getPerformanceSummary(userId: string): Promise<{
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
    topWin: string;
    topOpportunity: string;
  }> {
    try {
      const { data: systemState } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const views = systemState?.total_views || 0;
      const clicks = systemState?.total_clicks || 0;
      const conversions = systemState?.total_verified_conversions || 0;
      const revenue = Number(systemState?.total_verified_revenue) || 0;

      // Calculate performance score
      let score = 0;
      
      if (views > 0) score += 10;
      if (views > 100) score += 10;
      if (views > 1000) score += 10;
      
      if (clicks > 0) score += 10;
      if (clicks > 10) score += 10;
      if (clicks > 50) score += 10;
      
      const ctr = views > 0 ? (clicks / views) * 100 : 0;
      if (ctr > 1) score += 10;
      if (ctr > 2) score += 10;
      if (ctr > 3) score += 10;
      
      if (conversions > 0) score += 10;
      if (revenue > 0) score += 10;

      // Determine grade
      let grade: 'A' | 'B' | 'C' | 'D' | 'F';
      if (score >= 90) grade = 'A';
      else if (score >= 75) grade = 'B';
      else if (score >= 60) grade = 'C';
      else if (score >= 40) grade = 'D';
      else grade = 'F';

      // Generate summary
      let summary = '';
      if (grade === 'A') summary = 'Excellent! Your content is performing at the highest level.';
      else if (grade === 'B') summary = 'Good performance! Focus on scaling your winners.';
      else if (grade === 'C') summary = 'Moderate performance. Optimize hooks and CTAs.';
      else if (grade === 'D') summary = 'Needs improvement. Review content strategy.';
      else summary = 'Getting started. Keep posting consistently.';

      // Top win and opportunity
      let topWin = 'N/A';
      let topOpportunity = 'Generate more traffic';

      if (ctr > 2) {
        topWin = `Strong ${ctr.toFixed(1)}% CTR - Your hooks are working!`;
      } else if (revenue > 0) {
        topWin = `$${revenue.toFixed(2)} verified revenue - System is profitable!`;
      } else if (views > 500) {
        topWin = `${views.toLocaleString()} views - Good reach!`;
      }

      if (clicks > 20 && conversions === 0) {
        topOpportunity = 'Fix conversion funnel - clicks not converting';
      } else if (ctr < 1 && views > 100) {
        topOpportunity = 'Improve hooks - CTR is below 1%';
      } else if (views < 100) {
        topOpportunity = 'Increase posting frequency for more data';
      }

      return {
        score,
        grade,
        summary,
        topWin,
        topOpportunity
      };

    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        score: 0,
        grade: 'F',
        summary: 'Unable to calculate performance',
        topWin: 'N/A',
        topOpportunity: 'Start posting content'
      };
    }
  }
};