import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AUTOPILOT ENGINE v4.0 - REAL DATA ONLY
 * 
 * STRICT RULES:
 * 1. ONLY query existing database records
 * 2. NEVER generate mock/fake data
 * 3. ALL products must come from real affiliate networks
 * 4. ALL clicks must come from real traffic sources
 * 5. ALL conversions must come from real postback URLs
 */

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

    console.log('🚀 Autopilot Engine: Starting for user:', userId);

    const results = {
      products_analyzed: 0,
      posts_scored: 0,
      decisions_made: 0,
      content_scheduled: 0,
      errors: [] as string[]
    };

    // STEP 1: Analyze existing products (from real networks only)
    const { data: products, error: productsError } = await supabaseClient
      .from('affiliate_links')
      .select('id, product_name, clicks, impressions, conversions, revenue, network')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (productsError) {
      results.errors.push(`Product query failed: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('⚠️ No products found - user needs to discover products first');
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No products found. Run product discovery first.',
          results,
          action_required: 'Connect affiliate networks and discover products'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    results.products_analyzed = products.length;
    console.log(`📊 Analyzing ${products.length} real products...`);

    // STEP 2: Score products based on REAL metrics
    const scoredProducts = products.map(product => {
      const clicks = product.clicks || 0;
      const impressions = product.impressions || 0;
      const conversions = product.conversions || 0;
      const revenue = Number(product.revenue || 0);

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const revenuePerClick = clicks > 0 ? revenue / clicks : 0;

      // Calculate performance score (0-100)
      const score = Math.min(100, 
        (ctr * 0.3) + 
        (conversionRate * 0.4) + 
        (revenuePerClick * 0.3)
      );

      return {
        ...product,
        score: Number(score.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        classification: score > 60 ? 'WINNER' : score > 30 ? 'TESTING' : 'WEAK'
      };
    });

    results.posts_scored = scoredProducts.length;

    // STEP 3: Make decisions based on performance
    const decisions = [];
    for (const product of scoredProducts) {
      let decision = 'cooldown';
      let reason = '';

      if (product.classification === 'WINNER') {
        decision = 'scale';
        reason = `High performance (score: ${product.score}, CTR: ${product.ctr}%)`;
      } else if (product.classification === 'WEAK' && product.impressions > 200) {
        decision = 'kill';
        reason = `Poor performance after ${product.impressions} impressions`;
      } else {
        reason = 'Collecting more data';
      }

      decisions.push({
        productId: product.id,
        productName: product.product_name,
        decision,
        reason,
        metrics: {
          score: product.score,
          ctr: product.ctr,
          conversions: product.conversions,
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
          reason,
          metrics: {
            score: product.score,
            ctr: product.ctr,
            conversions: product.conversions
          }
        });
    }

    results.decisions_made = decisions.length;
    console.log(`✅ Made ${decisions.length} decisions`);

    // STEP 4: Schedule content for WINNER products only
    const winners = scoredProducts.filter(p => p.classification === 'WINNER');
    
    if (winners.length > 0) {
      console.log(`🎯 Found ${winners.length} winning products - scheduling content...`);

      for (const winner of winners.slice(0, 3)) { // Max 3 posts per cycle
        try {
          // Schedule post for 2 hours from now
          const scheduledTime = new Date();
          scheduledTime.setHours(scheduledTime.getHours() + 2);

          const { error: scheduleError } = await supabaseClient
            .from('posted_content')
            .insert({
              user_id: userId,
              link_id: winner.id,
              platform: 'pinterest',
              caption: `🔥 ${winner.product_name} - Now available!`,
              status: 'scheduled',
              scheduled_for: scheduledTime.toISOString()
            });

          if (scheduleError) {
            results.errors.push(`Failed to schedule ${winner.product_name}: ${scheduleError.message}`);
          } else {
            results.content_scheduled++;
          }
        } catch (error) {
          console.error('Scheduling error:', error);
        }
      }
    }

    // Log cycle completion
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'autopilot_cycle_completed',
        details: `Analyzed ${results.products_analyzed} products, made ${results.decisions_made} decisions, scheduled ${results.content_scheduled} posts`,
        metadata: results,
        status: results.errors.length > 0 ? 'partial' : 'success'
      });

    console.log('✅ Autopilot cycle complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        decisions: decisions.slice(0, 5),
        winners: winners.map(w => w.product_name)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Autopilot error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});