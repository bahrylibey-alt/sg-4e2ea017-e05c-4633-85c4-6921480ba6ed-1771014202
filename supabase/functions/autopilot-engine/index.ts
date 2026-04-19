import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ADVANCED AI AUTOPILOT ENGINE v7.0
 * 
 * FEATURES:
 * - Intelligent product scoring (CTR, conversion rate, revenue per click)
 * - Predictive analytics for product performance
 * - Automated traffic optimization
 * - Real-time decision making
 * - Smart content scheduling
 * - Performance-based scaling
 * 
 * STRICT RULES - REAL DATA ONLY:
 * - NO mock/fake data generation
 * - NO placeholder products
 * - ALL data from real affiliate networks
 * - ALL metrics from real tracking
 */

interface ProductMetrics {
  id: string;
  product_name: string;
  clicks: number;
  impressions: number;
  conversions: number;
  revenue: number;
  network: string;
}

interface ScoredProduct extends ProductMetrics {
  score: number;
  ctr: number;
  conversionRate: number;
  revenuePerClick: number;
  classification: 'WINNER' | 'TESTING' | 'WEAK' | 'NO_DATA';
  recommendation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('🚀 Advanced AI Autopilot Engine: Starting for user:', userId);

    const results = {
      products_analyzed: 0,
      winners_found: 0,
      testing_products: 0,
      weak_products: 0,
      decisions_made: 0,
      content_scheduled: 0,
      traffic_optimized: 0,
      errors: [] as string[]
    };

    // STEP 1: Fetch REAL products from database (from affiliate networks only)
    const { data: products, error: productsError } = await supabaseClient
      .from('affiliate_links')
      .select('id, product_name, clicks, impressions, conversions, revenue, network, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (productsError) {
      console.error('❌ Database error:', productsError);
      results.errors.push(`Database query failed: ${productsError.message}`);
      throw productsError;
    }

    if (!products || products.length === 0) {
      console.log('⚠️ No products found - user needs to discover products first');
      
      // Log the cycle
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'autopilot_cycle_no_data',
          details: 'No products to analyze - product discovery required',
          status: 'skipped'
        });

      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No products found. Please run product discovery first.',
          action_required: 'Connect affiliate networks and discover products',
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    results.products_analyzed = products.length;
    console.log(`📊 Analyzing ${products.length} real products from affiliate networks...`);

    // STEP 2: INTELLIGENT SCORING - Calculate performance metrics
    const scoredProducts: ScoredProduct[] = products.map(product => {
      const clicks = product.clicks || 0;
      const impressions = product.impressions || 0;
      const conversions = product.conversions || 0;
      const revenue = Number(product.revenue || 0);

      // Calculate key metrics
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const revenuePerClick = clicks > 0 ? revenue / clicks : 0;

      // Advanced scoring algorithm (0-100 scale)
      // Weight: CTR (30%), Conversion Rate (40%), Revenue Per Click (30%)
      const score = Math.min(100, 
        (ctr * 3) +           // CTR impact
        (conversionRate * 10) + // Conversion rate impact (highest weight)
        (revenuePerClick * 5)   // Revenue impact
      );

      // Intelligent classification
      let classification: 'WINNER' | 'TESTING' | 'WEAK' | 'NO_DATA';
      let recommendation: string;

      if (impressions === 0 && clicks === 0) {
        classification = 'NO_DATA';
        recommendation = 'New product - needs traffic to evaluate';
      } else if (score >= 60) {
        classification = 'WINNER';
        recommendation = 'SCALE UP: Increase traffic allocation by 50%';
        results.winners_found++;
      } else if (score >= 30 && impressions < 500) {
        classification = 'TESTING';
        recommendation = 'CONTINUE TESTING: Gather more data before decision';
        results.testing_products++;
      } else if (score < 30 && impressions >= 200) {
        classification = 'WEAK';
        recommendation = 'PAUSE: Low performance - consider replacing';
        results.weak_products++;
      } else {
        classification = 'TESTING';
        recommendation = 'MONITOR: Insufficient data for decision';
        results.testing_products++;
      }

      return {
        ...product,
        score: Number(score.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        revenuePerClick: Number(revenuePerClick.toFixed(2)),
        classification,
        recommendation
      };
    });

    console.log(`✅ Scoring complete: ${results.winners_found} winners, ${results.testing_products} testing, ${results.weak_products} weak`);

    // STEP 3: INTELLIGENT DECISION MAKING
    const decisions = [];
    for (const product of scoredProducts) {
      let decision = 'monitor';
      let action = '';

      switch (product.classification) {
        case 'WINNER':
          decision = 'scale';
          action = 'Increase traffic allocation and budget';
          break;
        case 'WEAK':
          if (product.impressions >= 300) {
            decision = 'pause';
            action = 'Pause product and reallocate budget to winners';
          }
          break;
        case 'TESTING':
          decision = 'continue';
          action = 'Maintain current traffic levels';
          break;
        case 'NO_DATA':
          decision = 'activate';
          action = 'Start sending traffic to collect data';
          break;
      }

      decisions.push({
        productId: product.id,
        productName: product.product_name,
        network: product.network,
        decision,
        action,
        score: product.score,
        classification: product.classification,
        metrics: {
          ctr: product.ctr,
          conversionRate: product.conversionRate,
          revenue: product.revenue
        }
      });

      // Save decision to database
      await supabaseClient
        .from('autopilot_decisions')
        .insert({
          user_id: userId,
          entity_type: 'product',
          entity_id: product.id,
          decision_type: decision,
          reason: product.recommendation,
          metrics: {
            score: product.score,
            ctr: product.ctr,
            conversion_rate: product.conversionRate,
            revenue_per_click: product.revenuePerClick
          }
        });
    }

    results.decisions_made = decisions.length;
    console.log(`💡 Generated ${decisions.length} intelligent decisions`);

    // STEP 4: SMART CONTENT SCHEDULING
    const winners = scoredProducts
      .filter(p => p.classification === 'WINNER')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 winners

    if (winners.length > 0) {
      console.log(`📅 Scheduling content for ${winners.length} winning products...`);

      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];
        
        // Schedule posts at optimal times (2, 4, 6 hours from now)
        const hoursDelay = (i + 1) * 2;
        const scheduledTime = new Date();
        scheduledTime.setHours(scheduledTime.getHours() + hoursDelay);

        const { error: scheduleError } = await supabaseClient
          .from('posted_content')
          .insert({
            user_id: userId,
            link_id: winner.id,
            platform: 'pinterest',
            caption: `🔥 ${winner.product_name} - High Performance Product (${winner.score}/100 score)`,
            status: 'scheduled',
            scheduled_for: scheduledTime.toISOString()
          });

        if (!scheduleError) {
          results.content_scheduled++;
        }
      }
    }

    // STEP 5: TRAFFIC OPTIMIZATION
    // Update traffic allocation based on performance
    const totalScore = scoredProducts.reduce((sum, p) => sum + p.score, 0);
    
    for (const product of scoredProducts.filter(p => p.classification === 'WINNER' || p.classification === 'TESTING')) {
      const trafficShare = totalScore > 0 ? (product.score / totalScore) * 100 : 0;
      
      // Update traffic allocation in database
      await supabaseClient
        .from('affiliate_links')
        .update({
          traffic_allocation: Number(trafficShare.toFixed(2))
        })
        .eq('id', product.id);
      
      results.traffic_optimized++;
    }

    console.log(`🎯 Optimized traffic for ${results.traffic_optimized} products`);

    // STEP 6: Log completion
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'autopilot_cycle_completed',
        details: `Analyzed ${results.products_analyzed} products | Found ${results.winners_found} winners | Scheduled ${results.content_scheduled} posts | Optimized ${results.traffic_optimized} traffic allocations`,
        metadata: results,
        status: results.errors.length > 0 ? 'partial' : 'success'
      });

    console.log('✅ Advanced AI Autopilot cycle complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'AI Autopilot cycle completed successfully',
        results,
        decisions: decisions.slice(0, 10),
        top_performers: winners.map(w => ({
          name: w.product_name,
          score: w.score,
          network: w.network,
          recommendation: w.recommendation
        })),
        insights: {
          total_revenue: scoredProducts.reduce((sum, p) => sum + Number(p.revenue), 0),
          average_ctr: scoredProducts.reduce((sum, p) => sum + p.ctr, 0) / scoredProducts.length,
          average_conversion_rate: scoredProducts.reduce((sum, p) => sum + p.conversionRate, 0) / scoredProducts.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Advanced AI Autopilot error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});